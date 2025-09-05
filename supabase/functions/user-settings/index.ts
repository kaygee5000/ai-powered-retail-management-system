import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          profile_data: any;
          notification_preferences: any;
          ai_settings: any;
          security_settings: any;
          appearance_settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_data?: any;
          notification_preferences?: any;
          ai_settings?: any;
          security_settings?: any;
          appearance_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_data?: any;
          notification_preferences?: any;
          ai_settings?: any;
          security_settings?: any;
          appearance_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const defaultSettings = {
  profile_data: {},
  notification_preferences: {
    lowStock: true,
    highSales: true,
    dailyReports: false,
    weeklyReports: true,
    unusualActivity: true,
    smsNotifications: false,
    pushNotifications: true,
    emailNotifications: true
  },
  ai_settings: {
    country: "GH",
    currency: "GHS",
    language: "en",
    timezone: "Africa/Accra",
    enableVoiceInput: true,
    autoProcessReports: true,
    confidenceThreshold: 85
  },
  security_settings: {
    loginAttempts: 5,
    twoFactorAuth: false,
    passwordExpiry: 90,
    sessionTimeout: 30
  },
  appearance_settings: {
    theme: "light",
    compactMode: false,
    primaryColor: "blue"
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient<Database>(
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

    switch (req.method) {
      case 'GET':
        // Get user settings
        const { data: existingSettings, error: getError } = await supabaseClient
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (getError && getError.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          return new Response(
            JSON.stringify({ error: getError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!existingSettings) {
          // Create default settings if they don't exist
          const { data: newSettings, error: createError } = await supabaseClient
            .from('user_settings')
            .insert({
              user_id: user.id,
              ...defaultSettings,
            })
            .select('*')
            .single();

          if (createError) {
            return new Response(
              JSON.stringify({ error: createError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(JSON.stringify(newSettings), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(existingSettings), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        const updateData = await req.json();
        
        // Check if user settings exist
        const { data: currentSettings } = await supabaseClient
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!currentSettings) {
          // Create new settings if they don't exist
          const { data: newSettings, error: createError } = await supabaseClient
            .from('user_settings')
            .insert({
              user_id: user.id,
              ...defaultSettings,
              ...updateData,
            })
            .select('*')
            .single();

          if (createError) {
            return new Response(
              JSON.stringify({ error: createError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(JSON.stringify(newSettings), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Update existing settings
          const { data: updatedSettings, error: updateError } = await supabaseClient
            .from('user_settings')
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select('*')
            .single();

          if (updateError) {
            return new Response(
              JSON.stringify({ error: updateError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(JSON.stringify(updatedSettings), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'DELETE':
        // Reset settings to defaults
        const { data: resetSettings, error: resetError } = await supabaseClient
          .from('user_settings')
          .update({
            ...defaultSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select('*')
          .single();

        if (resetError) {
          return new Response(
            JSON.stringify({ error: resetError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify(resetSettings), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
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