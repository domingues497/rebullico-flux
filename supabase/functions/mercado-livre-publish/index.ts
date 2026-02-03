import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishPayload {
  title: string;
  category_id: string;
  price: number;
  currency_id?: string;
  available_quantity?: number;
  buying_mode?: string;
  listing_type_id?: string;
  condition?: string;
  description?: string;
  pictures?: string[];
  attributes?: Array<{ id: string; value_name: string }>;
  variations?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch integration
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: integration, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('provider', 'mercadolivre')
      .eq('user_id', user.id)
      .single();

    let token = Deno.env.get("MELI_ACCESS_TOKEN"); // Fallback

    if (integration) {
      token = integration.access_token;
      const expiresAt = new Date(integration.expires_at);
      
      // Refresh if expired or expiring in 5 mins
      if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
        console.log('Refreshing token...');
        const appId = Deno.env.get('MELI_APP_ID');
        const clientSecret = Deno.env.get('MELI_CLIENT_SECRET');

        if (appId && clientSecret) {
          const refreshRes = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: appId,
              client_secret: clientSecret,
              refresh_token: integration.refresh_token
            })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            token = refreshData.access_token;
            
            await supabaseAdmin
              .from('integrations')
              .update({
                access_token: refreshData.access_token,
                refresh_token: refreshData.refresh_token,
                expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
              })
              .eq('id', integration.id);
          } else {
            console.error('Failed to refresh token', await refreshRes.text());
          }
        }
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ error: "Mercado Livre token not found. Please connect your account." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json()) as PublishPayload;
    if (!body?.title || !body?.category_id || !body?.price) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: title, category_id, price" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload: Record<string, any> = {
      title: body.title,
      category_id: body.category_id,
      price: body.price,
      currency_id: body.currency_id || "BRL",
      available_quantity: body.available_quantity ?? 1,
      buying_mode: body.buying_mode || "buy_it_now",
      listing_type_id: body.listing_type_id || "gold_special",
      condition: body.condition || "new",
      pictures: (body.pictures || []).map((url) => ({ source: url })),
    };

    if (Array.isArray(body.attributes) && body.attributes.length > 0) {
      payload.attributes = body.attributes;
    }
    if (Array.isArray(body.variations) && body.variations.length > 0) {
      payload.variations = body.variations;
    }

    const res = await fetch("https://api.mercadolibre.com/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Erro ao publicar no Mercado Livre:", data);
      return new Response(JSON.stringify({ error: "Falha ao criar item", details: data }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.description && data.id) {
      const descRes = await fetch(`https://api.mercadolibre.com/items/${data.id}/description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plain_text: body.description }),
      });
      const descData = await descRes.json();
      if (!descRes.ok) {
        console.warn("Descrição não publicada:", descData);
      }
    }

    return new Response(JSON.stringify({ success: true, item: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error("Erro inesperado:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado", details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
