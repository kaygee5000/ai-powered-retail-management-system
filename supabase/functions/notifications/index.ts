import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface NotificationRequest {
  type: 'alert' | 'report' | 'system';
  title: string;
  message: string;
  userId?: string;
  data?: any;
}

// In-memory store for SSE connections
const connections = new Map<string, ReadableStreamDefaultController>();

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
        if (path === 'stream') {
          return handleSSEConnection(user.id)
        }
        break
      
      case 'POST':
        if (path === 'send') {
          const notificationData: NotificationRequest = await req.json()
          return await handleSendNotification(user.id, notificationData)
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

function handleSSEConnection(userId: string) {
  const stream = new ReadableStream({
    start(controller) {
      // Store connection for this user
      connections.set(userId, controller)
      
      // Send initial connection message
      const initialMessage = {
        type: 'connection',
        message: 'Connected to real-time notifications',
        timestamp: new Date().toISOString()
      }
      
      controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`)
      
      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          }
          controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`)
        } catch (error) {
          console.log('Heartbeat failed, connection likely closed')
          clearInterval(heartbeatInterval)
          connections.delete(userId)
        }
      }, 30000) // Every 30 seconds
      
      // Cleanup on connection close
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        connections.delete(userId)
      }
      
      // Handle cleanup
      controller.enqueue = new Proxy(controller.enqueue, {
        apply(target, thisArg, argumentsList) {
          try {
            return target.apply(thisArg, argumentsList)
          } catch (error) {
            cleanup()
            throw error
          }
        }
      })
    },
    
    cancel() {
      connections.delete(userId)
    }
  })

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function handleSendNotification(fromUserId: string, notificationData: NotificationRequest) {
  const notification = {
    id: crypto.randomUUID(),
    ...notificationData,
    fromUserId,
    timestamp: new Date().toISOString()
  }

  // If specific user is targeted, send only to them
  if (notificationData.userId) {
    const controller = connections.get(notificationData.userId)
    if (controller) {
      try {
        controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`)
      } catch (error) {
        console.error('Failed to send notification to user:', notificationData.userId, error)
        connections.delete(notificationData.userId)
      }
    }
  } else {
    // Broadcast to all connected users
    for (const [userId, controller] of connections.entries()) {
      try {
        controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`)
      } catch (error) {
        console.error('Failed to send notification to user:', userId, error)
        connections.delete(userId)
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Notification sent',
      notification 
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Cleanup old connections periodically
setInterval(() => {
  console.log(`Active connections: ${connections.size}`)
}, 60000) // Every minute