import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface SignInRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  password: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const url = new URL(req.url)
    const segments = url.pathname.split('/').filter(Boolean)
    const path = segments.slice(3).join('/')

    switch (req.method) {
      case 'POST':
        if (path === 'login') {
          const loginData: SignInRequest = await req.json()
          return await handleSignIn(supabaseClient, loginData)
        } else if (path === 'signup') {
          const signupData: SignUpRequest = await req.json()
          return await handleSignUp(supabaseClient, signupData)
        } else if (path === 'logout') {
          return await handleSignOut(req, supabaseClient)
        } else if (path === 'refresh') {
          const refreshData: RefreshTokenRequest = await req.json()
          return await handleRefreshToken(supabaseClient, refreshData)
        } else if (path === 'reset-password') {
          const resetData: ResetPasswordRequest = await req.json()
          return await handleResetPassword(supabaseClient, resetData)
        }
        break
      
      case 'GET':
        if (path === 'session') {
          return await handleGetSession(req, supabaseClient)
        }
        break
      
      default:
        throw new Error('Method not allowed')
    }

    throw new Error('Endpoint not found')

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

async function handleSignIn(supabase: any, loginData: SignInRequest) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginData.email,
    password: loginData.password,
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Create or get user settings
  const { error: settingsError } = await ensureUserSettings(supabase, data.user.id, data.user.email)
  if (settingsError) {
    console.warn('Failed to create user settings:', settingsError)
  }

  return new Response(
    JSON.stringify({
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleSignUp(supabase: any, signupData: SignUpRequest) {
  const { data, error } = await supabase.auth.signUp({
    email: signupData.email,
    password: signupData.password,
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Create default user settings if user was created
  if (data.user && !data.user.email_confirmed_at) {
    const { error: settingsError } = await ensureUserSettings(supabase, data.user.id, data.user.email)
    if (settingsError) {
      console.warn('Failed to create user settings:', settingsError)
    }
  }

  return new Response(
    JSON.stringify({
      user: data.user,
      session: data.session,
      message: data.user?.email_confirmed_at ? 
        'User created and logged in successfully' : 
        'Check your email for the confirmation link'
    }),
    { 
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleSignOut(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'No authorization header' }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const { error } = await supabase.auth.admin.signOut(token)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ message: 'Signed out successfully' }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleRefreshToken(supabase: any, refreshData: RefreshTokenRequest) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshData.refresh_token
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleResetPassword(supabase: any, resetData: ResetPasswordRequest) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(resetData.email, {
    redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/callback`
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      message: 'Password reset email sent successfully',
      data 
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleGetSession(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ user: null, session: null }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response(
      JSON.stringify({ user: null, session: null }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      user,
      session: {
        access_token: token,
        user
      }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function ensureUserSettings(supabase: any, userId: string, userEmail: string) {
  try {
    // Check if settings exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return { error: null }
    }

    // Create default settings
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

    const { error } = await supabase
      .from('user_settings')
      .insert([defaultSettings])

    return { error }
  } catch (error) {
    return { error }
  }
}