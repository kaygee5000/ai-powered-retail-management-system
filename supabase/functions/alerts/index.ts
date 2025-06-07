import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface AlertRequest {
  type: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location_id: string;
  timestamp: string;
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
        return await handleGetAlerts(supabaseClient, user.id, url.searchParams)
      
      case 'POST':
        const alertData: AlertRequest = await req.json()
        return await handleCreateAlert(supabaseClient, user.id, alertData)
      
      case 'PUT':
        if (path.endsWith('/resolve')) {
          const alertId = path.replace('/resolve', '')
          return await handleResolveAlert(supabaseClient, user.id, alertId)
        } else {
          const updateData = await req.json()
          return await handleUpdateAlert(supabaseClient, user.id, path, updateData)
        }
      
      case 'DELETE':
        return await handleDeleteAlert(supabaseClient, user.id, path)
      
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

async function handleGetAlerts(supabase: any, userId: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('alerts')
    .select(`
      *,
      location:locations(name)
    `)
    .eq('user_id', userId)

  // Apply filters based on query parameters
  const type = searchParams.get('type')
  const severity = searchParams.get('severity')
  const resolved = searchParams.get('resolved')
  const locationId = searchParams.get('location_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  if (type) {
    query = query.eq('type', type)
  }

  if (severity) {
    query = query.eq('severity', severity)
  }

  if (resolved !== null && resolved !== undefined) {
    query = query.eq('resolved', resolved === 'true')
  }

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  if (startDate) {
    query = query.gte('timestamp', startDate)
  }

  if (endDate) {
    query = query.lte('timestamp', endDate)
  }

  // Order by created_at descending by default
  const sortBy = searchParams.get('sort_by') || 'created_at'
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

async function handleCreateAlert(supabase: any, userId: string, alertData: AlertRequest) {
  // Validate location belongs to user
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('id', alertData.location_id)
    .eq('user_id', userId)
    .single()

  if (locationError) throw new Error('Location not found or unauthorized')

  const { data, error } = await supabase
    .from('alerts')
    .insert([{ ...alertData, user_id: userId }])
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

async function handleResolveAlert(supabase: any, userId: string, alertId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ resolved: true })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleUpdateAlert(supabase: any, userId: string, alertId: string, updates: any) {
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
    .from('alerts')
    .update(updates)
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDeleteAlert(supabase: any, userId: string, alertId: string) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}