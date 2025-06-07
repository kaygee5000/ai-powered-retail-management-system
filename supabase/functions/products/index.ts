import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ProductRequest {
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  location_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from Authorization header
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
    
    // Remove 'functions/v1/products' from segments to get the actual path
    const path = segments.slice(3).join('/')

    switch (req.method) {
      case 'GET':
        return await handleGetProducts(supabaseClient, user.id, path, url.searchParams)
      
      case 'POST':
        const productData: ProductRequest = await req.json()
        return await handleCreateProduct(supabaseClient, user.id, productData)
      
      case 'PUT':
        const updateData: Partial<ProductRequest> = await req.json()
        return await handleUpdateProduct(supabaseClient, user.id, path, updateData)
      
      case 'DELETE':
        return await handleDeleteProduct(supabaseClient, user.id, path)
      
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

async function handleGetProducts(supabase: any, userId: string, path: string, searchParams: URLSearchParams) {
  if (path) {
    // Get single product by ID
    const { data, error } = await supabase
      .from('products')
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
    // Get all products with filtering
    let query = supabase
      .from('products')
      .select(`
        *,
        location:locations(name)
      `)
      .eq('user_id', userId)

    // Apply filters based on query parameters
    const category = searchParams.get('category')
    const locationId = searchParams.get('location_id')
    const lowStock = searchParams.get('low_stock')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const search = searchParams.get('search')
    const sku = searchParams.get('sku')

    if (category) {
      query = query.eq('category', category)
    }

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (lowStock === 'true') {
      // This requires a custom filter since we need to compare stock <= min_stock
      // We'll handle this in the application layer for now
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice))
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    if (sku) {
      query = query.eq('sku', sku)
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

    // Apply low stock filter in application layer if needed
    let filteredData = data
    if (lowStock === 'true') {
      filteredData = data.filter(product => product.stock <= product.min_stock)
    }

    return new Response(
      JSON.stringify(filteredData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreateProduct(supabase: any, userId: string, productData: ProductRequest) {
  // Validate location belongs to user
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('id', productData.location_id)
    .eq('user_id', userId)
    .single()

  if (locationError) throw new Error('Location not found or unauthorized')

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...productData, user_id: userId }])
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

async function handleUpdateProduct(supabase: any, userId: string, productId: string, updates: Partial<ProductRequest>) {
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
    .from('products')
    .update({ ...updates, last_updated: new Date().toLocaleDateString() })
    .eq('id', productId)
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

async function handleDeleteProduct(supabase: any, userId: string, productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}