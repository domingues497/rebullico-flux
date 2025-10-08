// Supabase Edge Function: Publicar produto no Mercado Livre
// Requer variável de ambiente: MELI_ACCESS_TOKEN
// Payload esperado no body:
// {
//   title: string,
//   category_id: string,
//   price: number,
//   currency_id?: string, // default BRL
//   available_quantity?: number,
//   buying_mode?: string, // default buy_it_now
//   listing_type_id?: string, // default gold_special
//   condition?: string, // default new
//   description?: string,
//   pictures?: string[], // array de URLs
//   attributes?: Array<{ id: string; value_name: string }>,
//   variations?: any[]
// }
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const token = Deno.env.get("MELI_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "MELI_ACCESS_TOKEN não configurado" }), { status: 500 });
    }

    const body = (await req.json()) as PublishPayload;
    if (!body?.title || !body?.category_id || !body?.price) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: title, category_id, price" }), { status: 400 });
    }

    // Validar campos obrigatórios adicionais
    if (body.price <= 0) {
      return new Response(JSON.stringify({ error: "Preço deve ser maior que zero" }), { status: 400 });
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

    // Cria o item no Mercado Livre
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
      return new Response(JSON.stringify({ error: "Falha ao criar item", details: data }), { status: res.status });
    }

    // Se houver descrição, publicar em endpoint de descrição
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

    return new Response(JSON.stringify({ success: true, item: data }), { status: 200 });
  } catch (e) {
    console.error("Erro inesperado:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado", details: String(e) }), { status: 500 });
  }
});