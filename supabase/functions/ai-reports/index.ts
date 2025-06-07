import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ReportRequest {
  location_id: string;
  staff: string;
  raw_text: string;
  timestamp?: string;
}

interface AIParseRequest {
  text: string;
  confidence_threshold?: number;
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
        return await handleGetReports(supabaseClient, user.id)
      
      case 'POST':
        if (path === 'parse') {
          const parseData: AIParseRequest = await req.json()
          return await handleParseText(parseData)
        } else {
          const reportData: ReportRequest = await req.json()
          return await handleCreateReport(supabaseClient, user.id, reportData)
        }
      
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

async function handleGetReports(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      location:locations(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleParseText(parseData: AIParseRequest) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    // Fallback to rule-based parsing
    return new Response(
      JSON.stringify({
        success: true,
        data: parseWithRules(parseData.text),
        confidence: 0.65
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const prompt = `Parse this retail report into structured data. Extract sales amounts, inventory changes, notes, and any alerts.

Report: "${parseData.text}"

Please respond with a JSON object containing:
- sales: total sales amount (number)
- inventory: array of {item, count, action} objects
- notes: important observations
- alerts: array of alert messages
- customer_feedback: any customer comments
- staff_observations: staff notes

Response:`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 10
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API failed with status ${response.status}`)
    }

    const result = await response.json()
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const aiText = result.candidates[0].content.parts[0].text
      const parsedData = extractDataFromAIResponse(aiText)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: parsedData,
          confidence: 0.85
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Invalid response format from Gemini API')
    }
  } catch (error) {
    console.error('AI parsing failed:', error)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: parseWithRules(parseData.text),
        confidence: 0.65
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreateReport(supabase: any, userId: string, reportData: ReportRequest) {
  // Parse the report using AI
  const parseResult = await handleParseText({ text: reportData.raw_text })
  const parseResponse = await parseResult.json()
  
  const newReport = {
    ...reportData,
    timestamp: reportData.timestamp || new Date().toISOString(),
    parsed_data: parseResponse.data || {},
    confidence: parseResponse.confidence || 0,
    status: parseResponse.success ? 'processed' : 'flagged',
    user_id: userId
  }

  const { data, error } = await supabase
    .from('reports')
    .insert([newReport])
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

function extractDataFromAIResponse(aiText: string) {
  try {
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // JSON parsing failed
  }

  return parseWithRules(aiText)
}

function parseWithRules(text: string) {
  const result: any = {
    inventory: [],
    alerts: [],
    notes: ''
  }

  // Extract sales amounts
  const salesMatches = text.match(/\$?(\d+(?:\.\d{2})?)/g)
  if (salesMatches) {
    const amounts = salesMatches.map(m => parseFloat(m.replace('$', '')))
    result.sales = amounts.reduce((sum, amount) => sum + amount, 0)
  }

  return result
}