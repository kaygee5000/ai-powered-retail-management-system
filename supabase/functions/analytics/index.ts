import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
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

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get sales data
    const { data: salesData, error: salesError } = await supabaseClient
      .from('sales')
      .select('total, items, timestamp, location_id, locations(name)')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (salesError) {
      return new Response(
        JSON.stringify({ error: salesError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get products data
    const { data: productsData, error: productsError } = await supabaseClient
      .from('products')
      .select('category, stock, min_stock, price, location_id, locations(name)')
      .eq('user_id', user.id);

    if (productsError) {
      return new Response(
        JSON.stringify({ error: productsError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate analytics
    const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
    const totalTransactions = salesData?.length || 0;
    const totalItems = salesData?.reduce((sum, sale) => sum + Number(sale.items), 0) || 0;
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Low stock alerts
    const lowStockProducts = productsData?.filter(product => 
      Number(product.stock) <= Number(product.min_stock)
    ) || [];

    // Category analysis
    const categoryAnalysis = productsData?.reduce((acc: any, product) => {
      if (!acc[product.category]) {
        acc[product.category] = {
          category: product.category,
          totalProducts: 0,
          totalValue: 0,
          lowStock: 0,
        };
      }
      acc[product.category].totalProducts += 1;
      acc[product.category].totalValue += Number(product.price) * Number(product.stock);
      if (Number(product.stock) <= Number(product.min_stock)) {
        acc[product.category].lowStock += 1;
      }
      return acc;
    }, {});

    // Location analysis
    const locationAnalysis = salesData?.reduce((acc: any, sale) => {
      const locationName = sale.locations?.name || 'Unknown';
      if (!acc[locationName]) {
        acc[locationName] = {
          location: locationName,
          totalSales: 0,
          transactions: 0,
          items: 0,
        };
      }
      acc[locationName].totalSales += Number(sale.total);
      acc[locationName].transactions += 1;
      acc[locationName].items += Number(sale.items);
      return acc;
    }, {});

    // Sales trend (daily aggregation)
    const salesTrend = salesData?.reduce((acc: any, sale) => {
      const date = new Date(sale.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          sales: 0,
          transactions: 0,
          items: 0,
        };
      }
      acc[date].sales += Number(sale.total);
      acc[date].transactions += 1;
      acc[date].items += Number(sale.items);
      return acc;
    }, {});

    const analyticsData = {
      summary: {
        totalSales,
        totalTransactions,
        totalItems,
        averageOrderValue,
        lowStockAlerts: lowStockProducts.length,
      },
      salesTrend: Object.values(salesTrend || {}).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      categoryAnalysis: Object.values(categoryAnalysis || {}),
      locationAnalysis: Object.values(locationAnalysis || {}),
      lowStockProducts: lowStockProducts.slice(0, 10), // Limit to top 10
      timeRange,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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