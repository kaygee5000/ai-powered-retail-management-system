import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          manager: string;
          status: string;
          sales: number;
          inventory: number;
          last_report: string;
          alerts: number;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          manager: string;
          status?: string;
          sales?: number;
          inventory?: number;
          last_report?: string;
          alerts?: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          manager?: string;
          status?: string;
          sales?: number;
          inventory?: number;
          last_report?: string;
          alerts?: number;
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
    const locationId = segments[segments.length - 1];

    switch (req.method) {
      case 'GET':
        if (locationId && locationId !== 'locations') {
          // Get single location
          const { data, error } = await supabaseClient
            .from('locations')
            .select('*')
            .eq('id', locationId)
            .eq('user_id', user.id)
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Get all locations with filters
          let query = supabaseClient
            .from('locations')
            .select('*')
            .eq('user_id', user.id);

          // Apply filters from query parameters
          const status = url.searchParams.get('status');
          const search = url.searchParams.get('search');
          const sort_by = url.searchParams.get('sort_by') || 'created_at';
          const sort_order = url.searchParams.get('sort_order') || 'desc';

          if (status) {
            query = query.eq('status', status);
          }
          if (search) {
            query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,manager.ilike.%${search}%`);
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
        }

      case 'POST':
        const createData = await req.json();
        const { data: createdLocation, error: createError } = await supabaseClient
          .from('locations')
          .insert({
            ...createData,
            user_id: user.id,
            status: createData.status || 'active',
            sales: createData.sales || 0,
            inventory: createData.inventory || 0,
            last_report: createData.last_report || 'Never',
            alerts: createData.alerts || 0,
          })
          .select('*')
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

        return new Response(JSON.stringify(createdLocation), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!locationId || locationId === 'locations') {
          return new Response(
            JSON.stringify({ error: 'Location ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const updateData = await req.json();
        const { data: updatedLocation, error: updateError } = await supabaseClient
          .from('locations')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', locationId)
          .eq('user_id', user.id)
          .select('*')
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

        return new Response(JSON.stringify(updatedLocation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        if (!locationId || locationId === 'locations') {
          return new Response(
            JSON.stringify({ error: 'Location ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check if location has associated products
        const { count: productCount } = await supabaseClient
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', locationId)
          .eq('user_id', user.id);

        if (productCount && productCount > 0) {
          return new Response(
            JSON.stringify({ 
              error: `Cannot delete location. ${productCount} products are associated with this location.` 
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error: deleteError } = await supabaseClient
          .from('locations')
          .delete()
          .eq('id', locationId)
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
          JSON.stringify({ success: true, message: 'Location deleted successfully' }),
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