import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface LocationRequest {
  name: string;
  address: string;
  manager: string;
  status?: 'active' | 'inactive' | 'attention';
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
        return await handleGetLocations(supabaseClient, user.id, path, url.searchParams)
      
      case 'POST':
        const locationData: LocationRequest = await req.json()
        return await handleCreateLocation(supabaseClient, user.id, locationData)
      
      case 'PUT':
        const updateData: Partial<LocationRequest> = await req.json()
        return await handleUpdateLocation(supabaseClient, user.id, path, updateData)
      
      case 'DELETE':
        return await handleDeleteLocation(supabaseClient, user.id, path)
      
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

async function handleGetLocations(supabase: any, userId: string, path: string, searchParams: URLSearchParams) {
  if (path) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
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
      .from('locations')
      .select('*')
      .eq('user_id', userId)

    // Apply filters based on query parameters
    const status = searchParams.get('status')
    const manager = searchParams.get('manager')
    const search = searchParams.get('search')

    if (status) {
      query = query.eq('status', status)
    }

    if (manager) {
      query = query.ilike('manager', `%${manager}%`)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,manager.ilike.%${search}%`)
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
}

async function handleCreateLocation(supabase: any, userId: string, locationData: LocationRequest) {
  const { data, error } = await supabase
    .from('locations')
    .insert([{ ...locationData, user_id: userId }])
    .select()
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

async function handleUpdateLocation(supabase: any, userId: string, locationId: string, updates: Partial<LocationRequest>) {
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', locationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDeleteLocation(supabase: any, userId: string, locationId: string) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}