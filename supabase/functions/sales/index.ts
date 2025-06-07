import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface SaleRequest {
  timestamp: string;
  location_id: string;
  total: number;
  items: number;
  staff: string;
  payment_method: string;
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
    const segments = url.pathname.split('/').filter(Boolean)
    const path = segments.slice(3).join('/')

    switch (req.method) {
      case 'GET':
        return await handleGetSales(supabaseClient, user.id, path, url.searchParams)
      
      case 'POST':
        const saleData: SaleRequest = await req.json()
        return await handleCreateSale(supabaseClient, user.id, saleData)
      
      case 'PUT':
        const updateData: Partial<SaleRequest> = await req.json()
        return await handleUpdateSale(supabaseClient, user.id, path, updateData)
      
      case 'DELETE':
        return await handleDeleteSale(supabaseClient, user.id, path)
      
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

async function handleGetSales(supabase: any, userId: string, path: string, searchParams: URLSearchParams) {
  if (path) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        location:locations(name)
      `)
      .eq('id', path)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } else {
    let query = supabase
      .from('sales')
      .select(`
        *,
        location:locations(name)
      `)
      .eq('user_id', userId)

    // Apply filters based on query parameters
    const locationId = searchParams.get('location_id')
    const paymentMethod = searchParams.get('payment_method')
    const staff = searchParams.get('staff')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const minTotal = searchParams.get('min_total')
    const maxTotal = searchParams.get('max_total')
    const minItems = searchParams.get('min_items')
    const maxItems = searchParams.get('max_items')

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod)
    }

    if (staff) {
      query = query.ilike('staff', `%${staff}%`)
    }

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }

    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    if (minTotal) {
      query = query.gte('total', parseFloat(minTotal))
    }

    if (maxTotal) {
      query = query.lte('total', parseFloat(maxTotal))
    }

    if (minItems) {
      query = query.gte('items', parseInt(minItems))
    }

    if (maxItems) {
      query = query.lte('items', parseInt(maxItems))
    }

    // Order by timestamp descending by default
    const sortBy = searchParams.get('sort_by') || 'timestamp'
    const sortOrder = searchParams.get('sort_order') === 'asc' ? true : false

    query = query.order(sortBy, { ascending: sortOrder })

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreateSale(supabase: any, userId: string, saleData: SaleRequest) {
  // Validate location belongs to user
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('id', saleData.location_id)
    .eq('user_id', userId)
    .single()

  if (locationError) throw new Error('Location not found or unauthorized')

  const { data, error } = await supabase
    .from('sales')
    .insert([{ ...saleData, user_id: userId }])
    .select(`
      *,
      location:locations(name)
    `)
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { 
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleUpdateSale(supabase: any, userId: string, saleId: string, updates: Partial<SaleRequest>) {
  // If location_id is being updated, validate it belongs to user
  if (updates.location_id) {
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', updates.location_id)
      .eq('user_id', userId)
      .single()

    if (locationError) throw new Error('Location not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('sales')
    .update(updates)
    .eq('id', saleId)
    .eq('user_id', userId)
    .select(`
      *,
      location:locations(name)
    `)
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDeleteSale(supabase: any, userId: string, saleId: string) {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}