import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface InventoryAdjustmentRequest {
  product_id: string;
  quantity_change: number;
  reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
  notes?: string;
  timestamp?: string;
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
        return await handleGetAdjustments(supabaseClient, user.id, url.searchParams)
      
      case 'POST':
        const adjustmentData: InventoryAdjustmentRequest = await req.json()
        return await handleCreateAdjustment(supabaseClient, user.id, adjustmentData)
      
      case 'DELETE':
        return await handleDeleteAdjustment(supabaseClient, user.id, path)
      
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

async function handleGetAdjustments(supabase: any, userId: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('inventory_adjustments')
    .select(`
      *,
      product:products(id, name, sku),
      location:products!inner(location:locations(id, name))
    `)
    .eq('user_id', userId)

  // Apply filters based on query parameters
  const productId = searchParams.get('product_id')
  const reason = searchParams.get('reason')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const locationId = searchParams.get('location_id')

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
    query = query.eq('products.location_id', locationId)
  }

  query = query.order('timestamp', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreateAdjustment(supabase: any, userId: string, adjustmentData: InventoryAdjustmentRequest) {
  // Start a transaction to ensure data consistency
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, stock, name')
    .eq('id', adjustmentData.product_id)
    .eq('user_id', userId)
    .single()

  if (productError) throw new Error('Product not found or unauthorized')

  // Check if adjustment would result in negative stock
  const newStock = product.stock + adjustmentData.quantity_change
  if (newStock < 0) {
    throw new Error(`Cannot adjust stock below 0. Current stock: ${product.stock}, Adjustment: ${adjustmentData.quantity_change}`)
  }

  // Create the adjustment record
  const { data: adjustment, error: adjustmentError } = await supabase
    .from('inventory_adjustments')
    .insert([{
      ...adjustmentData,
      timestamp: adjustmentData.timestamp || new Date().toISOString(),
      user_id: userId
    }])
    .select(`
      *,
      product:products(id, name, sku, stock)
    `)
    .single()

  if (adjustmentError) throw adjustmentError

  // Update the product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      stock: newStock,
      last_updated: new Date().toLocaleDateString()
    })
    .eq('id', adjustmentData.product_id)
    .eq('user_id', userId)

  if (updateError) {
    // If stock update fails, we should ideally rollback the adjustment
    // For now, we'll throw an error
    throw new Error('Failed to update product stock')
  }

  return new Response(
    JSON.stringify(adjustment),
    { 
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleDeleteAdjustment(supabase: any, userId: string, adjustmentId: string) {
  // Get the adjustment first
  const { data: adjustment, error: getError } = await supabase
    .from('inventory_adjustments')
    .select('*, product:products(id, stock)')
    .eq('id', adjustmentId)
    .eq('user_id', userId)
    .single()

  if (getError) throw new Error('Adjustment not found or unauthorized')

  // Reverse the stock change
  const newStock = adjustment.product.stock - adjustment.quantity_change
  if (newStock < 0) {
    throw new Error('Cannot reverse adjustment: would result in negative stock')
  }

  // Update product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      stock: newStock,
      last_updated: new Date().toLocaleDateString()
    })
    .eq('id', adjustment.product_id)

  if (updateError) throw updateError

  // Delete the adjustment
  const { error: deleteError } = await supabase
    .from('inventory_adjustments')
    .delete()
    .eq('id', adjustmentId)
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}