import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateUserPayload = {
  email?: string;
  password?: string;
  nome?: string;
  perfil?: string;
  role?: string;
  telefone?: string;
  phone?: string;
  celular?: string;
  cpf?: string;
  documento?: string;
  ativo?: boolean | string | number;
};

class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const response = (
  status: number,
  requestId: string,
  body: Record<string, unknown>,
): Response => {
  return new Response(JSON.stringify({ requestId, ...body }), {
    status,
    headers: jsonHeaders,
  });
};

const getRequestId = (req: Request): string => {
  return req.headers.get("x-request-id") || req.headers.get("x-sb-request-id") || crypto.randomUUID();
};

const normalizeEmail = (value?: string): string => (value || "").trim().toLowerCase();

const digitsOnly = (value?: string): string | null => {
  const digits = (value || "").replace(/\D+/g, "");
  return digits.length > 0 ? digits : null;
};

const normalizePerfil = (value?: string): string => {
  const raw = (value || "USUARIO")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  const aliasMap: Record<string, string> = {
    ADMINISTRADOR: "ADMIN",
    ADM: "ADMIN",
    OPERADOR: "OPERADOR",
    OPERATOR: "OPERADOR",
    TECNICO: "TECNICO",
    TECNICA: "TECNICO",
    TEC: "TECNICO",
    USUARIO: "USUARIO",
    USER: "USUARIO",
  };

  return aliasMap[raw] || raw;
};

const normalizeAtivo = (value: CreateUserPayload["ativo"]): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "sim", "yes", "ativo"].includes(normalized);
  }
  return true;
};

const parseBearerToken = (authHeader: string | null): string | null => {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const findAuthUserByEmail = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  requestId: string,
) => {
  // Limite alto para minimizar chamadas extras e manter comportamento previsível.
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw new HttpError(500, "auth_list_users_failed", "Falha ao listar usuários no Auth", {
      authError: error.message,
    });
  }

  const found = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || null;

  console.log("[create-user] auth.listUsers result", {
    requestId,
    searchedEmail: email,
    foundUserId: found?.id || null,
    totalUsersFetched: data.users.length,
  });

  return found;
};

const upsertUsuarioWithFallback = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
  requestId: string,
) => {
  const { error: upsertError } = await supabaseAdmin
    .from("usuarios")
    .upsert(record, { onConflict: "id" });

  if (!upsertError) return;

  const message = upsertError.message || "";
  const maybeMissingColumn =
    message.toLowerCase().includes("column") ||
    message.toLowerCase().includes("schema cache") ||
    message.toLowerCase().includes("does not exist");

  console.error("[create-user] usuarios upsert failed:first-attempt", {
    requestId,
    message,
    code: upsertError.code,
    details: upsertError.details,
    hint: upsertError.hint,
  });

  if (!maybeMissingColumn) {
    throw new HttpError(500, "usuarios_upsert_failed", "Falha ao salvar usuário em public.usuarios", {
      message: upsertError.message,
      code: upsertError.code,
      details: upsertError.details,
      hint: upsertError.hint,
    });
  }

  // Fallback resiliente para instalações com schema reduzido.
  const minimalRecord = {
    id: record.id,
    email: record.email,
    nome: record.nome,
    perfil: record.perfil,
    role: record.role,
    ativo: record.ativo,
  };

  const { error: fallbackError } = await supabaseAdmin
    .from("usuarios")
    .upsert(minimalRecord, { onConflict: "id" });

  if (fallbackError) {
    throw new HttpError(500, "usuarios_upsert_failed", "Falha ao salvar usuário em public.usuarios", {
      firstAttempt: upsertError.message,
      fallbackAttempt: fallbackError.message,
    });
  }

  console.log("[create-user] usuarios upsert fallback succeeded", { requestId });
};

Deno.serve(async (req) => {
  const requestId = getRequestId(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: jsonHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(
        500,
        "missing_env",
        "Required Supabase environment variables are not configured",
        {
          hasSupabaseUrl: Boolean(SUPABASE_URL),
          hasAnonKey: Boolean(SUPABASE_ANON_KEY),
          hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        },
      );
    }

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const token = parseBearerToken(authHeader);

    let payload: CreateUserPayload;
    try {
      payload = await req.json();
    } catch {
      throw new HttpError(400, "invalid_payload", "Request body must be valid JSON");
    }

    console.log("[create-user] request:start", {
      requestId,
      method: req.method,
      payloadKeys: Object.keys(payload || {}),
      hasAuthorizationHeader: Boolean(authHeader),
    });

    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST method is allowed");
    }

    if (!token) {
      throw new HttpError(401, "missing_authorization", "Authorization Bearer token is required");
    }

    console.log("[create-user] auth.validate-token:start", { requestId });
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (authResponse.status !== 200) {
      throw new HttpError(401, "invalid_token", "Provided token is invalid or expired", {
        authStatus: authResponse.status,
      });
    }

    const authUser = await authResponse.json();
    const requesterAuthUserId: string | undefined = authUser?.id;

    console.log("[create-user] auth.validate-token:done", {
      requestId,
      requesterAuthUserId: requesterAuthUserId || null,
    });

    if (!requesterAuthUserId) {
      throw new HttpError(401, "invalid_token", "Token validation succeeded but user id is missing");
    }

    const email = normalizeEmail(payload.email);
    const password = (payload.password || "").trim();
    const nome = (payload.nome || "").trim() || email;
    const perfil = normalizePerfil(payload.perfil || payload.role);
    const telefone = digitsOnly(payload.telefone || payload.phone || payload.celular);
    const cpf = digitsOnly(payload.cpf || payload.documento);
    const ativo = normalizeAtivo(payload.ativo);

    if (!email || !password) {
      throw new HttpError(400, "invalid_payload", "Fields 'email' and 'password' are required");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRow, error: adminLookupError } = await supabaseAdmin
      .from("admins")
      .select("auth_user_id, ativo")
      .eq("auth_user_id", requesterAuthUserId)
      .eq("ativo", true)
      .maybeSingle();

    console.log("[create-user] admin-check", {
      requestId,
      requesterAuthUserId,
      hasAdminRow: Boolean(adminRow),
      adminLookupError: adminLookupError?.message || null,
    });

    if (adminLookupError) {
      throw new HttpError(500, "admin_lookup_failed", "Failed to validate admin permissions", {
        message: adminLookupError.message,
        code: adminLookupError.code,
        details: adminLookupError.details,
      });
    }

    if (!adminRow) {
      throw new HttpError(403, "forbidden", "Only active ADMIN users can create new users");
    }

    let authUserToPersist: { id: string; email?: string | null } | null = null;

    const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, email, requestId);
    if (existingAuthUser?.id) {
      authUserToPersist = existingAuthUser;
      console.log("[create-user] reusing-existing-auth-user", {
        requestId,
        userId: existingAuthUser.id,
        email,
      });
    } else {
      console.log("[create-user] auth.createUser:start", { requestId, email });
      const { data: createdUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome,
          perfil,
          role: perfil,
          telefone,
          cpf,
        },
      });

      if (createError || !createdUserData?.user?.id) {
        console.error("[create-user] auth.createUser:error", {
          requestId,
          error: createError?.message || "Unknown createUser error",
        });

        const existingAfterFailure = await findAuthUserByEmail(supabaseAdmin, email, requestId);
        if (existingAfterFailure?.id) {
          authUserToPersist = existingAfterFailure;
          console.log("[create-user] createUser failed but existing user found by email", {
            requestId,
            userId: existingAfterFailure.id,
          });
        } else {
          throw new HttpError(400, "auth_create_user_failed", createError?.message || "Could not create user", {
            createError,
          });
        }
      } else {
        authUserToPersist = createdUserData.user;
        console.log("[create-user] auth.createUser:done", {
          requestId,
          userId: authUserToPersist.id,
        });
      }
    }

    if (!authUserToPersist?.id) {
      throw new HttpError(500, "missing_auth_user", "Auth user could not be resolved");
    }

    await upsertUsuarioWithFallback(
      supabaseAdmin,
      {
        id: authUserToPersist.id,
        auth_user_id: authUserToPersist.id,
        email,
        nome,
        perfil,
        role: perfil,
        telefone,
        cpf,
        ativo,
      },
      requestId,
    );

    console.log("[create-user] request:success", {
      requestId,
      newUserId: authUserToPersist.id,
      email,
      perfil,
    });

    return response(201, requestId, {
      success: true,
      user: {
        id: authUserToPersist.id,
        email,
        nome,
        perfil,
        role: perfil,
        telefone,
        cpf,
        ativo,
      },
    });
  } catch (error) {
    const isHttpError = error instanceof HttpError;
    const status = isHttpError ? error.status : 500;
    const code = isHttpError ? error.code : "internal_error";
    const message = error instanceof Error ? error.message : "Unexpected error";
    const details = isHttpError
      ? error.details
      : {
          errorType: typeof error,
          rawError: String(error),
        };

    console.error("[create-user] request:failed", {
      requestId,
      status,
      code,
      message,
      details,
      stack: error instanceof Error ? error.stack : null,
    });

    return response(status, requestId, {
      success: false,
      error: code,
      message,
      details,
    });
  }
});
