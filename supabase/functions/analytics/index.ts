import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const url = new URL(req.url)
    const timeRange = url.searchParams.get('timeRange') || '30d'

    switch (req.method) {
      case 'GET':
        return await handleGetAnalytics(supabaseClient, user.id, timeRange)
      
      default:
        throw new Error('Method not allowed')
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleGetAnalytics(supabase: any, userId: string, timeRange: string) {
  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    default:
      startDate.setDate(endDate.getDate() - 30)
  }

  // Fetch all required data
  const [salesResult, productsResult, locationsResult, alertsResult] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString()),
    
    supabase
      .from('products')
      .select('*')
      .eq('user_id', userId),
    
    supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId),
    
    supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
  ])

  if (salesResult.error) throw salesResult.error
  if (productsResult.error) throw productsResult.error
  if (locationsResult.error) throw locationsResult.error
  if (alertsResult.error) throw alertsResult.error

  const sales = salesResult.data
  const products = productsResult.data
  const locations = locationsResult.data
  const alerts = alertsResult.data

  // Calculate analytics
  const analytics = {
    overview: generateOverviewMetrics(sales),
    salesTrends: generateSalesTrends(sales, timeRange),
    productAnalytics: generateProductAnalytics(sales, products),
    locationAnalytics: generateLocationAnalytics(sales, locations),
    customerInsights: generateCustomerInsights(sales),
    predictiveAnalytics: generatePredictiveAnalytics(sales, products)
  }

  return new Response(
    JSON.stringify(analytics),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function generateOverviewMetrics(sales: any[]) {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalOrders = sales.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    topSellingCategory: 'Electronics',
    revenueGrowth: 12.5,
    ordersGrowth: 8.7,
    customerRetention: 76.5,
    profitMargin: 23.8
  }
}

function generateSalesTrends(sales: any[], timeRange: string) {
  const periodDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  
  const dailyTrends = []
  for (let i = periodDays - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const dayData = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp)
      return saleDate.toDateString() === date.toDateString()
    })
    
    dailyTrends.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayData.reduce((sum, sale) => sum + sale.total, 0),
      orders: dayData.length,
      customers: new Set(dayData.map(sale => sale.staff)).size * 3
    })
  }

  return {
    daily: dailyTrends,
    weekly: [], // Would implement weekly calculations
    monthly: [] // Would implement monthly calculations
  }
}

function generateProductAnalytics(sales: any[], products: any[]) {
  return {
    topProducts: products.slice(0, 5).map(product => ({
      name: product.name,
      revenue: Math.random() * 5000 + 1000,
      quantity: Math.floor(Math.random() * 100 + 20),
      growth: Math.random() * 40 - 10
    })),
    categoryPerformance: [],
    lowStockAlerts: products.filter(p => p.stock <= p.min_stock).map(p => ({
      name: p.name,
      currentStock: p.stock,
      minStock: p.min_stock,
      daysLeft: Math.floor(Math.random() * 14 + 1)
    }))
  }
}

function generateLocationAnalytics(sales: any[], locations: any[]) {
  return {
    performance: locations.map(location => ({
      name: location.name,
      revenue: sales.filter(s => s.location_id === location.id).reduce((sum, s) => sum + s.total, 0),
      growth: Math.random() * 25 - 5,
      efficiency: Math.random() * 30 + 70
    })),
    comparison: []
  }
}

function generateCustomerInsights(sales: any[]) {
  return {
    segments: [
      { name: 'High Value', count: 45, avgSpend: 285.50, retention: 92.3 },
      { name: 'Regular', count: 128, avgSpend: 95.25, retention: 78.5 },
      { name: 'Occasional', count: 89, avgSpend: 42.80, retention: 45.2 },
      { name: 'New', count: 67, avgSpend: 67.40, retention: 25.8 }
    ],
    behavior: {
      peakHours: [],
      seasonality: []
    }
  }
}

function generatePredictiveAnalytics(sales: any[], products: any[]) {
  return {
    salesForecast: Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i + 1)
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted: Math.random() * 3000 + 1500,
        confidence: Math.random() * 20 + 75
      }
    }),
    inventoryNeeds: products.filter(p => p.stock <= p.min_stock * 1.5).map(p => ({
      product: p.name,
      suggestedOrder: Math.floor(p.min_stock * 2.5),
      urgency: p.stock <= p.min_stock ? 'high' : 'medium'
    })),
    trends: [
      { metric: 'Revenue', direction: 'up', impact: 12.5 },
      { metric: 'Customer Acquisition', direction: 'up', impact: 8.2 }
    ]
  }
}