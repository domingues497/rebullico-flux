import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()
    
    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get User ID from Supabase auth to ensure user is logged in
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser()

    if (userError || !user) throw new Error('User not authenticated')

    const appId = Deno.env.get('MELI_APP_ID')
    const clientSecret = Deno.env.get('MELI_CLIENT_SECRET')

    if (!appId || !clientSecret) {
      throw new Error('MELI_APP_ID or MELI_CLIENT_SECRET not set in Edge Function secrets')
    }

    console.log(`Exchanging code for token with redirect_uri: ${redirect_uri}`)

    // Exchange code for token
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

    // Use Service Role to write to integrations table securely (bypassing RLS if needed, but here we act as user so RLS should work if we use supabaseClient. However, integration table might have strict policies. 
    // Let's use service role to be safe and ensure we can upsert.)
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Save to database
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
