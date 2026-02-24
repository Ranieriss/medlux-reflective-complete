#!/usr/bin/env node

const {
  SUPABASE_FUNCTIONS_URL,
  CREATE_USER_ADMIN_TOKEN,
  CREATE_USER_OPERATOR_TOKEN
} = process.env

if (!SUPABASE_FUNCTIONS_URL) {
  console.error('Missing SUPABASE_FUNCTIONS_URL env var')
  process.exit(1)
}

const endpoint = `${SUPABASE_FUNCTIONS_URL.replace(/\/$/, '')}/create-user`
const requestId = `test-${Date.now()}`

async function assertStatus(name, response, expected) {
  if (response.status !== expected) {
    const text = await response.text()
    throw new Error(`${name}: expected ${expected}, got ${response.status}. body=${text}`)
  }
  console.log(`✅ ${name} => ${response.status}`)
}

async function run() {
  const preflight = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type,x-request-id'
    }
  })

  await assertStatus('CORS preflight', preflight, 204)

  if (CREATE_USER_ADMIN_TOKEN) {
    const adminResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${CREATE_USER_ADMIN_TOKEN}`,
        'content-type': 'application/json',
        'x-request-id': requestId
      },
      body: JSON.stringify({
        email: `codex.test.${Date.now()}@example.com`,
        password: '123456',
        nome: 'Codex Teste',
        perfil: 'OPERADOR',
        ativo: true
      })
    })
    await assertStatus('create-user as ADMIN', adminResp, 200)
  } else {
    console.warn('⚠️ Skipping admin scenario: missing CREATE_USER_ADMIN_TOKEN')
  }

  if (CREATE_USER_OPERATOR_TOKEN) {
    const operadorResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${CREATE_USER_OPERATOR_TOKEN}`,
        'content-type': 'application/json',
        'x-request-id': requestId
      },
      body: JSON.stringify({
        email: `codex.test.forbidden.${Date.now()}@example.com`,
        password: '123456',
        nome: 'Codex Forbidden',
        perfil: 'OPERADOR',
        ativo: true
      })
    })
    await assertStatus('create-user as OPERADOR', operadorResp, 403)
  } else {
    console.warn('⚠️ Skipping operador scenario: missing CREATE_USER_OPERATOR_TOKEN')
  }
}

run().catch((error) => {
  console.error('❌ test-create-user-flow failed:', error)
  process.exit(1)
})
