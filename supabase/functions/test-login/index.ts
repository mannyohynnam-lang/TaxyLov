import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEST_EMAIL = 'vbdasha@gmail.com'
const TEST_CODE = '12345678'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code } = await req.json()

    if (email !== TEST_EMAIL || code !== TEST_CODE) {
      return new Response(JSON.stringify({ error: 'Invalid test credentials' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Ensure the test user exists (idempotent)
    const { data: existing } = await adminClient.auth.admin.listUsers()
    const exists = existing?.users?.some((u) => u.email === TEST_EMAIL)
    if (!exists) {
      await adminClient.auth.admin.createUser({
        email: TEST_EMAIL,
        email_confirm: true,
      })
    }

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: TEST_EMAIL,
    })

    if (error || !data) {
      return new Response(JSON.stringify({ error: error?.message ?? 'Failed to generate link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ token_hash: data.properties.hashed_token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
