import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const appId = Deno.env.get('MELI_APP_ID')
    const clientSecret = Deno.env.get('MELI_CLIENT_SECRET')

    if (!appId || !clientSecret) {
      throw new Error('MELI_APP_ID or MELI_CLIENT_SECRET not set in Edge Function secrets')
    }

    // Handle GET request (OAuth Callback from Mercado Livre)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state') // Contains encoded JSON { userId, redirectUrl }

      if (!code || !state) {
        return new Response('Missing code or state parameters', { status: 400 })
      }

      let stateData
      try {
        stateData = JSON.parse(atob(state))
      } catch (e) {
        return new Response('Invalid state parameter', { status: 400 })
      }

      const { userId, redirectUrl } = stateData
      
      // The redirect_uri sent to get the token MUST match the one used in the auth URL
      // Since this function IS the redirect_uri, we use its own URL (without query params)
      const functionUrl = `${url.origin}${url.pathname}`

      console.log(`Exchanging code for token. Redirect URI: ${functionUrl}`)

      const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: appId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: functionUrl
        })
      })

      const tokenData = await tokenRes.json()

      if (!tokenRes.ok) {
        console.error('ML Token Error:', tokenData)
        return new Response(`Mercado Livre Auth Error: ${JSON.stringify(tokenData)}`, { status: 400 })
      }

      // Save to database using Service Role (since we don't have user session in GET request)
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      const { error: upsertError } = await supabaseAdmin
        .from('integrations')
        .upsert({
          provider: 'mercadolivre',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          user_id: userId
        }, {
          onConflict: 'provider,user_id'
        })

      if (upsertError) {
        console.error('Database Error:', upsertError)
        return new Response('Database Error', { status: 500 })
      }

      // Redirect back to the application
      return Response.redirect(`${redirectUrl}?status=success`)
    }

    // Handle POST request (Manual/Client-side exchange - Legacy support)
    const { code, redirect_uri } = await req.json()
    
    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) throw new Error('User not authenticated')

    console.log(`Exchanging code for token with redirect_uri: ${redirect_uri}`)

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirect_uri
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('ML Token Error:', tokenData)
      throw new Error(tokenData.message || 'Failed to get token from Mercado Livre')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { error: upsertError } = await supabaseAdmin
      .from('integrations')
      .upsert({
        provider: 'mercadolivre',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        user_id: user.id
      }, {
        onConflict: 'provider,user_id'
      })

    if (upsertError) {
      console.error('Database Error:', upsertError)
      throw new Error('Failed to save integration tokens')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
