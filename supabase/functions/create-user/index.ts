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
  cpf?: string;
  telefone?: string;
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

const response = (status: number, requestId: string, body: Record<string, unknown>): Response => {
  return new Response(JSON.stringify({ requestId, ...body }), {
    status,
    headers: jsonHeaders,
  });
};

const getRequestId = (req: Request): string => {
  return req.headers.get("x-request-id") || req.headers.get("x-sb-request-id") || crypto.randomUUID();
};

const parseBearerToken = (authHeader: string | null): string | null => {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
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

const findAuthUserByEmail = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  requestId: string,
) => {
  const adminApi = supabaseAdmin.auth.admin as { getUserByEmail?: (email: string) => Promise<{ data: { user: { id: string; email?: string | null } | null }; error: { message: string; status?: number } | null }> };

  if (typeof adminApi.getUserByEmail !== "function") {
    throw new HttpError(500, "auth_api_not_supported", "Current supabase-js version does not expose admin.getUserByEmail");
  }

  const { data, error } = await adminApi.getUserByEmail(email);

  if (error && error.status !== 404 && !error.message?.toLowerCase().includes("not found")) {
    throw new HttpError(500, "auth_get_user_by_email_failed", "Failed to query auth user by email", {
      message: error.message,
      status: error.status,
    });
  }

  console.log("[create-user] auth.getUserByEmail", {
    requestId,
    searchedEmail: email,
    foundUserId: data?.user?.id || null,
    error: error?.message || null,
  });

  return data?.user || null;
};

const ensureCallerIsAdmin = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  requesterAuthUserId: string,
  requestId: string,
) => {
  const { data: adminRow, error: adminsError } = await supabaseAdmin
    .from("admins")
    .select("auth_user_id, ativo")
    .eq("auth_user_id", requesterAuthUserId)
    .eq("ativo", true)
    .maybeSingle();

  if (adminsError) {
    throw new HttpError(500, "admin_lookup_failed", "Failed to validate admin permissions", {
      source: "admins",
      message: adminsError.message,
      code: adminsError.code,
      details: adminsError.details,
    });
  }

  const { data: usuarioRow, error: usuarioError } = await supabaseAdmin
    .from("usuarios")
    .select("auth_user_id, perfil, ativo")
    .eq("auth_user_id", requesterAuthUserId)
    .eq("ativo", true)
    .maybeSingle();

  if (usuarioError) {
    throw new HttpError(500, "admin_lookup_failed", "Failed to validate admin permissions", {
      source: "usuarios",
      message: usuarioError.message,
      code: usuarioError.code,
      details: usuarioError.details,
    });
  }

  const usuarioPerfil = normalizePerfil((usuarioRow?.perfil as string | undefined) || "");
  const isAdmin = Boolean(adminRow) || usuarioPerfil === "ADMIN";

  console.log("[create-user] admin-check", {
    requestId,
    requesterAuthUserId,
    isAdmin,
    hasAdminRow: Boolean(adminRow),
    usuarioPerfil: usuarioPerfil || null,
  });

  if (!isAdmin) {
    throw new HttpError(403, "forbidden", "Only ADMIN users can create new users");
  }
};

Deno.serve(async (req) => {
  const requestId = getRequestId(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: jsonHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(500, "missing_env", "Required environment variables are not configured", {
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      });
    }

    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST method is allowed");
    }

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const token = parseBearerToken(authHeader);

    if (!token) {
      throw new HttpError(401, "missing_authorization", "Authorization Bearer token is required");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    console.log("[create-user] auth.validate-token:start", { requestId });
    const {
      data: { user: requesterUser },
      error: requesterError,
    } = await supabaseAdmin.auth.getUser(token);

    if (requesterError || !requesterUser?.id) {
      throw new HttpError(401, "invalid_token", "Provided token is invalid or expired", {
        message: requesterError?.message || null,
      });
    }

    console.log("[create-user] auth.validate-token:done", {
      requestId,
      requesterAuthUserId: requesterUser.id,
      requesterEmail: requesterUser.email || null,
    });

    let payload: CreateUserPayload;
    try {
      payload = await req.json();
    } catch {
      throw new HttpError(400, "invalid_payload", "Request body must be valid JSON");
    }

    console.log("[create-user] request:start", {
      requestId,
      payloadKeys: Object.keys(payload || {}),
      hasAuthorizationHeader: Boolean(authHeader),
    });

    const email = normalizeEmail(payload.email);
    const password = (payload.password || "").trim();
    const nome = (payload.nome || "").trim() || email;
    const perfil = normalizePerfil(payload.perfil);
    const cpf = digitsOnly(payload.cpf);
    const telefone = digitsOnly(payload.telefone);
    const ativo = normalizeAtivo(payload.ativo);

    if (!email || !password) {
      throw new HttpError(400, "invalid_payload", "Fields 'email' and 'password' are required");
    }

    await ensureCallerIsAdmin(supabaseAdmin, requesterUser.id, requestId);

    let authUser = await findAuthUserByEmail(supabaseAdmin, email, requestId);

    if (!authUser?.id) {
      console.log("[create-user] auth.createUser:start", { requestId, email });
      const { data: createdUserData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome,
          perfil,
          cpf,
          telefone,
        },
      });

      if (createErr || !createdUserData?.user?.id) {
        console.error("[create-user] auth.createUser:error", {
          requestId,
          email,
          createErrMessage: createErr?.message || null,
          createErrCode: createErr?.code || null,
          createErrStatus: createErr?.status || null,
          createErr,
        });

        authUser = await findAuthUserByEmail(supabaseAdmin, email, requestId);

        if (!authUser?.id) {
          throw new HttpError(
            500,
            "auth_create_user_failed",
            "Failed to create user (and could not find existing user)",
            {
              createErrMessage: createErr?.message || "Unknown createUser error",
              createErrCode: createErr?.code || null,
              createErrStatus: createErr?.status || null,
            },
          );
        }
      } else {
        authUser = createdUserData.user;
        console.log("[create-user] auth.createUser:done", {
          requestId,
          userId: authUser.id,
          email,
        });
      }
    }

    const usuarioRecord = {
      auth_user_id: authUser.id,
      email,
      nome,
      perfil,
      telefone,
      cpf,
      ativo,
    };

    const { error: upsertError } = await supabaseAdmin
      .from("usuarios")
      .upsert(usuarioRecord, { onConflict: "auth_user_id" });

    if (upsertError) {
      console.error("[create-user] usuarios.upsert:error", {
        requestId,
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
        usuarioRecord,
      });

      throw new HttpError(500, "usuarios_upsert_failed", "Auth user was created, but failed to upsert public.usuarios", {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
      });
    }

    console.log("[create-user] request:success", {
      requestId,
      createdAuthUserId: authUser.id,
      email,
      perfil,
    });

    return response(201, requestId, {
      success: true,
      message: "User created/updated successfully",
      user: {
        auth_user_id: authUser.id,
        email,
        nome,
        perfil,
        cpf,
        telefone,
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
