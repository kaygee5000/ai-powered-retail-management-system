import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

    switch (req.method) {
      case 'GET':
        return await handleGetSettings(supabaseClient, user.id, user.email)
      
      case 'PUT':
        const updates = await req.json()
        return await handleUpdateSettings(supabaseClient, user.id, updates)
      
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

async function handleGetSettings(supabase: any, userId: string, userEmail: string) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default settings
        return await createDefaultSettings(supabase, userId, userEmail)
      } else {
        throw error
      }
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

async function createDefaultSettings(supabase: any, userId: string, userEmail: string) {
  const defaultSettings = {
    user_id: userId,
    profile_data: {
      name: userEmail?.split('@')[0] || 'User',
      phone: '',
      role: 'Store Owner'
    },
    notification_preferences: {
      lowStock: true,
      highSales: true,
      unusualActivity: true,
      dailyReports: false,
      weeklyReports: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    },
    ai_settings: {
      confidenceThreshold: 85,
      autoProcessReports: true,
      enableVoiceInput: true,
      language: 'en',
      timezone: 'Africa/Accra',
      currency: 'GHS',
      country: 'GH'
    },
    security_settings: {
      twoFactorAuth: false,
      passwordExpiry: 90,
      sessionTimeout: 30,
      loginAttempts: 5
    },
    appearance_settings: {
      theme: 'light',
      primaryColor: 'blue',
      compactMode: false
    }
  }

  const { data, error } = await supabase
    .from('user_settings')
    .insert([defaultSettings])
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

async function handleUpdateSettings(supabase: any, userId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}