import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid token");
    }

    // Check if user has admin role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select(`
        role_id,
        roles!inner(name)
      `)
      .eq('id', userData.user.id)
      .single();

    const userRole = profile?.roles?.name;
    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin role required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    switch (method) {
      case 'GET':
        return await handleGet(supabaseClient, url);
      case 'POST':
        return await handlePost(supabaseClient, req);
      case 'PUT':
        return await handlePut(supabaseClient, req, url);
      case 'DELETE':
        return await handleDelete(supabaseClient, url);
      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
        );
    }
  } catch (error) {
    console.error('Settings API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleGet(supabase: any, url: URL) {
  const key = url.searchParams.get('key');
  
  if (key) {
    // Get specific setting
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('chave', key)
      .maybeSingle();

    if (error) throw error;
    
    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else {
    // Get all settings
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('chave');

    if (error) throw error;
    
    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handlePost(supabase: any, req: Request) {
  const { chave, valor } = await req.json();
  
  if (!chave || valor === undefined) {
    throw new Error("Key (chave) and value (valor) are required");
  }

  const { data, error } = await supabase
    .from('settings')
    .insert({ chave, valor })
    .select()
    .single();

  if (error) throw error;
  
  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePut(supabase: any, req: Request, url: URL) {
  const key = url.searchParams.get('key');
  if (!key) {
    throw new Error("Key parameter is required");
  }

  const { valor } = await req.json();
  if (valor === undefined) {
    throw new Error("Value (valor) is required");
  }

  const { data, error } = await supabase
    .from('settings')
    .update({ valor, updated_at: new Date().toISOString() })
    .eq('chave', key)
    .select()
    .single();

  if (error) throw error;
  
  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDelete(supabase: any, url: URL) {
  const key = url.searchParams.get('key');
  if (!key) {
    throw new Error("Key parameter is required");
  }

  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('chave', key);

  if (error) throw error;
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}