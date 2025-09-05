import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
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

    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const action = segments[segments.length - 1];

    switch (req.method) {
      case 'GET':
        // Get all reports
        const { data: reports, error: reportsError } = await supabaseClient
          .from('reports')
          .select(`
            *,
            location:locations(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (reportsError) {
          return new Response(
            JSON.stringify({ error: reportsError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify(reports || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'POST':
        if (action === 'parse') {
          // Parse text using AI
          const { text } = await req.json();
          
          if (!text) {
            return new Response(
              JSON.stringify({ error: 'Text is required for parsing' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          // Simple rule-based parsing (AI integration would be added here)
          const parsedData = {
            inventory: [],
            alerts: [],
            notes: text,
            confidence: 0.8
          };

          // Look for inventory patterns
          const inventoryPattern = /(\d+)\s+(\w+)/g;
          let match;
          while ((match = inventoryPattern.exec(text)) !== null) {
            parsedData.inventory.push({
              product: match[2],
              quantity: parseInt(match[1]),
              notes: 'Auto-detected from text'
            });
          }

          // Look for alert keywords
          const alertKeywords = ['low', 'empty', 'out', 'problem', 'issue', 'broken', 'damaged'];
          for (const keyword of alertKeywords) {
            if (text.toLowerCase().includes(keyword)) {
              parsedData.alerts.push({
                type: 'system',
                message: `Potential issue detected: ${keyword}`,
                severity: 'medium'
              });
            }
          }

          return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Create new report
          const createData = await req.json();
          
          if (!createData.raw_text || !createData.location_id || !createData.staff) {
            return new Response(
              JSON.stringify({ error: 'Missing required fields: raw_text, location_id, staff' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          const { data: createdReport, error: createError } = await supabaseClient
            .from('reports')
            .insert({
              ...createData,
              user_id: user.id,
              timestamp: createData.timestamp || new Date().toISOString(),
              parsed_data: createData.parsed_data || {},
              confidence: createData.confidence || 0.8,
              status: createData.status || 'pending',
            })
            .select(`
              *,
              location:locations(name)
            `)
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

          return new Response(JSON.stringify(createdReport), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

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