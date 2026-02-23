import { supabase } from '@/services/supabase'

function buildRequestId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const accessToken = data?.session?.access_token
  if (!accessToken) {
    const err = new Error('Sessão expirada. Faça login novamente.')
    err.code = 'SESSION_EXPIRED'
    err.status = 401
    throw err
  }

  return accessToken
}

function normalizeInvokeError(invokeError, responseData, requestId) {
  const body = invokeError?.context?.json || invokeError?.context || responseData || null
  const status = invokeError?.context?.status || invokeError?.status || null

  return {
    requestId: body?.requestId || requestId,
    status,
    code: body?.error || invokeError?.code || 'edge_function_error',
    message: body?.message || invokeError?.message || 'Erro ao executar Edge Function.',
    body
  }
}

export async function invokeEdgeFunctionWithAuth(functionName, body, options = {}) {
  const requestId = options.requestId || buildRequestId()
  const accessToken = await getAccessToken()

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-request-id': requestId,
      ...options.headers
    }
  })

  if (error || data?.success === false || data?.error) {
    const normalizedError = normalizeInvokeError(error, data, requestId)
    const err = new Error(normalizedError.message)
    err.details = normalizedError
    err.code = normalizedError.code
    err.status = normalizedError.status
    throw err
  }

  return {
    requestId: data?.requestId || requestId,
    data
  }
}
