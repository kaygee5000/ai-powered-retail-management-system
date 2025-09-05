import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string;
          type: string;
          severity: string;
          message: string;
          location_id: string;
          timestamp: string;
          resolved: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          type: string;
          severity: string;
          message: string;
          location_id: string;
          timestamp: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          type?: string;
          severity?: string;
          message?: string;
          location_id?: string;
          timestamp?: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const alertId = segments[segments.length - 1];
    const action = segments[segments.length - 2];

    switch (req.method) {
      case 'GET':
        // Get all alerts with filters
        let query = supabaseClient
          .from('alerts')
          .select(`
            *,
            location:locations(name)
          `)
          .eq('user_id', user.id);

        // Apply filters from query parameters
        const location_id = url.searchParams.get('location_id');
        const type = url.searchParams.get('type');
        const severity = url.searchParams.get('severity');
        const resolved = url.searchParams.get('resolved');
        const start_date = url.searchParams.get('start_date');
        const end_date = url.searchParams.get('end_date');
        const sort_by = url.searchParams.get('sort_by') || 'timestamp';
        const sort_order = url.searchParams.get('sort_order') || 'desc';

        if (location_id) {
          query = query.eq('location_id', location_id);
        }
        if (type) {
          query = query.eq('type', type);
        }
        if (severity) {
          query = query.eq('severity', severity);
        }
        if (resolved !== null) {
          query = query.eq('resolved', resolved === 'true');
        }
        if (start_date) {
          query = query.gte('timestamp', start_date);
        }
        if (end_date) {
          query = query.lte('timestamp', end_date);
        }

        query = query.order(sort_by, { ascending: sort_order === 'asc' });

        const { data, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'POST':
        const createData = await req.json();
        
        // Validate required fields
        if (!createData.type || !createData.severity || !createData.message || !createData.location_id) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: type, severity, message, location_id' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Validate enum values
        const validTypes = ['low_stock', 'high_return', 'unusual_activity', 'sales_spike', 'system'];
        const validSeverities = ['low', 'medium', 'high'];

        if (!validTypes.includes(createData.type)) {
          return new Response(
            JSON.stringify({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!validSeverities.includes(createData.severity)) {
          return new Response(
            JSON.stringify({ error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: createdAlert, error: createError } = await supabaseClient
          .from('alerts')
          .insert({
            ...createData,
            user_id: user.id,
            timestamp: createData.timestamp || new Date().toISOString(),
            resolved: false,
          })
          .select(`
            *,
            location:locations(name)
          `)
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify(createdAlert), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!alertId || alertId === 'alerts') {
          return new Response(
            JSON.stringify({ error: 'Alert ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check if this is a resolve action
        if (action === 'resolve') {
          const { data: resolvedAlert, error: resolveError } = await supabaseClient
            .from('alerts')
            .update({
              resolved: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', alertId)
            .eq('user_id', user.id)
            .select(`
              *,
              location:locations(name)
            `)
            .single();

          if (resolveError) {
            return new Response(
              JSON.stringify({ error: resolveError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(JSON.stringify(resolvedAlert), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Regular update
          const updateData = await req.json();
          const { data: updatedAlert, error: updateError } = await supabaseClient
            .from('alerts')
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', alertId)
            .eq('user_id', user.id)
            .select(`
              *,
              location:locations(name)
            `)
            .single();

          if (updateError) {
            return new Response(
              JSON.stringify({ error: updateError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(JSON.stringify(updatedAlert), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'DELETE':
        if (!alertId || alertId === 'alerts') {
          return new Response(
            JSON.stringify({ error: 'Alert ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error: deleteError } = await supabaseClient
          .from('alerts')
          .delete()
          .eq('id', alertId)
          .eq('user_id', user.id);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Alert deleted successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});