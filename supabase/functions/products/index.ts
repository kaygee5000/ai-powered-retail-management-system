import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          sku: string;
          category: string;
          price: number;
          stock: number;
          min_stock: number;
          location_id: string;
          last_updated: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          sku: string;
          category: string;
          price: number;
          stock: number;
          min_stock: number;
          location_id: string;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          sku?: string;
          category?: string;
          price?: number;
          stock?: number;
          min_stock?: number;
          location_id?: string;
          last_updated?: string;
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
    const productId = segments[segments.length - 1];

    switch (req.method) {
      case 'GET':
        if (productId && productId !== 'products') {
          // Get single product
          const { data, error } = await supabaseClient
            .from('products')
            .select(`
              *,
              location:locations(name)
            `)
            .eq('id', productId)
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
          // Get all products with filters
          let query = supabaseClient
            .from('products')
            .select(`
              *,
              location:locations(name)
            `)
            .eq('user_id', user.id);

          // Apply filters from query parameters
          const category = url.searchParams.get('category');
          const location_id = url.searchParams.get('location_id');
          const low_stock = url.searchParams.get('low_stock');
          const min_price = url.searchParams.get('min_price');
          const max_price = url.searchParams.get('max_price');
          const search = url.searchParams.get('search');
          const sku = url.searchParams.get('sku');
          const sort_by = url.searchParams.get('sort_by') || 'created_at';
          const sort_order = url.searchParams.get('sort_order') || 'desc';

          if (category) {
            query = query.eq('category', category);
          }
          if (location_id) {
            query = query.eq('location_id', location_id);
          }
          if (low_stock === 'true') {
            query = query.filter('stock', 'lte', 'min_stock');
          }
          if (min_price) {
            query = query.gte('price', parseFloat(min_price));
          }
          if (max_price) {
            query = query.lte('price', parseFloat(max_price));
          }
          if (search) {
            query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
          }
          if (sku) {
            query = query.eq('sku', sku);
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
        const { data: createdProduct, error: createError } = await supabaseClient
          .from('products')
          .insert({
            ...createData,
            user_id: user.id,
            last_updated: new Date().toISOString(),
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

        return new Response(JSON.stringify(createdProduct), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!productId || productId === 'products') {
          return new Response(
            JSON.stringify({ error: 'Product ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const updateData = await req.json();
        const { data: updatedProduct, error: updateError } = await supabaseClient
          .from('products')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          })
          .eq('id', productId)
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

        return new Response(JSON.stringify(updatedProduct), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        if (!productId || productId === 'products') {
          return new Response(
            JSON.stringify({ error: 'Product ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error: deleteError } = await supabaseClient
          .from('products')
          .delete()
          .eq('id', productId)
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
          JSON.stringify({ success: true, message: 'Product deleted successfully' }),
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