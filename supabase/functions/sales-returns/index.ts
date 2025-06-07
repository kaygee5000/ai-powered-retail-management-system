import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface SalesReturnRequest {
  original_sale_id?: string;
  product_id?: string;
  quantity_returned?: number;
  refund_amount: number;
  reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
  notes?: string;
  timestamp?: string;
  location_id: string;
  staff: string;
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
        return await handleGetReturns(supabaseClient, user.id, url.searchParams)
      
      case 'POST':
        const returnData: SalesReturnRequest = await req.json()
        return await handleCreateReturn(supabaseClient, user.id, returnData)
      
      case 'DELETE':
        return await handleDeleteReturn(supabaseClient, user.id, path)
      
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

async function handleGetReturns(supabase: any, userId: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('sales_returns')
    .select(`
      *,
      original_sale:sales(id, total, timestamp),
      product:products(id, name, sku),
      location:locations(id, name)
    `)
    .eq('user_id', userId)

  // Apply filters based on query parameters
  const originalSaleId = searchParams.get('original_sale_id')
  const productId = searchParams.get('product_id')
  const reason = searchParams.get('reason')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const locationId = searchParams.get('location_id')
  const staff = searchParams.get('staff')

  if (originalSaleId) {
    query = query.eq('original_sale_id', originalSaleId)
  }

  if (productId) {
    query = query.eq('product_id', productId)
  }

  if (reason) {
    query = query.eq('reason', reason)
  }

  if (startDate) {
    query = query.gte('timestamp', startDate)
  }

  if (endDate) {
    query = query.lte('timestamp', endDate)
  }

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  if (staff) {
    query = query.ilike('staff', `%${staff}%`)
  }

  query = query.order('timestamp', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreateReturn(supabase: any, userId: string, returnData: SalesReturnRequest) {
  // Validate location belongs to user
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('id', returnData.location_id)
    .eq('user_id', userId)
    .single()

  if (locationError) throw new Error('Location not found or unauthorized')

  // If product_id is provided, validate and update stock
  if (returnData.product_id && returnData.quantity_returned) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, name')
      .eq('id', returnData.product_id)
      .eq('user_id', userId)
      .single()

    if (productError) throw new Error('Product not found or unauthorized')

    // Update product stock (add returned quantity back to inventory)
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock: product.stock + returnData.quantity_returned,
        last_updated: new Date().toLocaleDateString()
      })
      .eq('id', returnData.product_id)

    if (updateError) throw new Error('Failed to update product stock')
  }

  // Create the return record
  const { data: salesReturn, error: returnError } = await supabase
    .from('sales_returns')
    .insert([{
      ...returnData,
      timestamp: returnData.timestamp || new Date().toISOString(),
      user_id: userId
    }])
    .select(`
      *,
      original_sale:sales(id, total, timestamp),
      product:products(id, name, sku),
      location:locations(id, name)
    `)
    .single()

  if (returnError) throw returnError

  return new Response(
    JSON.stringify(salesReturn),
    { 
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleDeleteReturn(supabase: any, userId: string, returnId: string) {
  // Get the return first
  const { data: salesReturn, error: getError } = await supabase
    .from('sales_returns')
    .select('*, product:products(id, stock)')
    .eq('id', returnId)
    .eq('user_id', userId)
    .single()

  if (getError) throw new Error('Return not found or unauthorized')

  // If this return affected inventory, reverse the stock change
  if (salesReturn.product_id && salesReturn.quantity_returned) {
    const newStock = salesReturn.product.stock - salesReturn.quantity_returned
    if (newStock < 0) {
      throw new Error('Cannot reverse return: would result in negative stock')
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        last_updated: new Date().toLocaleDateString()
      })
      .eq('id', salesReturn.product_id)

    if (updateError) throw updateError
  }

  // Delete the return
  const { error: deleteError } = await supabase
    .from('sales_returns')
    .delete()
    .eq('id', returnId)
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}