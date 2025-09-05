import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      sales: {
        Row: {
          id: string;
          timestamp: string;
          location_id: string;
          total: number;
          items: number;
          staff: string;
          payment_method: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          timestamp: string;
          location_id: string;
          total: number;
          items?: number;
          staff: string;
          payment_method: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          location_id?: string;
          total?: number;
          items?: number;
          staff?: string;
          payment_method?: string;
          created_at?: string;
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
    const saleId = segments[segments.length - 1];

    switch (req.method) {
      case 'GET':
        if (saleId && saleId !== 'sales') {
          // Get single sale
          const { data, error } = await supabaseClient
            .from('sales')
            .select(`
              *,
              location:locations(name)
            `)
            .eq('id', saleId)
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
          // Get all sales with filters
          let query = supabaseClient
            .from('sales')
            .select(`
              *,
              location:locations(name)
            `)
            .eq('user_id', user.id);

          // Apply filters from query parameters
          const location_id = url.searchParams.get('location_id');
          const payment_method = url.searchParams.get('payment_method');
          const staff = url.searchParams.get('staff');
          const start_date = url.searchParams.get('start_date');
          const end_date = url.searchParams.get('end_date');
          const min_total = url.searchParams.get('min_total');
          const max_total = url.searchParams.get('max_total');
          const sort_by = url.searchParams.get('sort_by') || 'timestamp';
          const sort_order = url.searchParams.get('sort_order') || 'desc';

          if (location_id) {
            query = query.eq('location_id', location_id);
          }
          if (payment_method) {
            query = query.eq('payment_method', payment_method);
          }
          if (staff) {
            query = query.ilike('staff', `%${staff}%`);
          }
          if (start_date) {
            query = query.gte('timestamp', start_date);
          }
          if (end_date) {
            query = query.lte('timestamp', end_date);
          }
          if (min_total) {
            query = query.gte('total', parseFloat(min_total));
          }
          if (max_total) {
            query = query.lte('total', parseFloat(max_total));
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
        
        // Validate required fields
        if (!createData.timestamp || !createData.location_id || !createData.total || !createData.staff || !createData.payment_method) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: timestamp, location_id, total, staff, payment_method' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: createdSale, error: createError } = await supabaseClient
          .from('sales')
          .insert({
            ...createData,
            user_id: user.id,
            items: createData.items || 1,
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

        return new Response(JSON.stringify(createdSale), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!saleId || saleId === 'sales') {
          return new Response(
            JSON.stringify({ error: 'Sale ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const updateData = await req.json();
        const { data: updatedSale, error: updateError } = await supabaseClient
          .from('sales')
          .update(updateData)
          .eq('id', saleId)
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

        return new Response(JSON.stringify(updatedSale), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        if (!saleId || saleId === 'sales') {
          return new Response(
            JSON.stringify({ error: 'Sale ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error: deleteError } = await supabaseClient
          .from('sales')
          .delete()
          .eq('id', saleId)
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
          JSON.stringify({ success: true, message: 'Sale deleted successfully' }),
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