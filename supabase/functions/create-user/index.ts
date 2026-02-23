import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-request-id",
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

const PERFIS_VALIDOS = new Set(["ADMIN", "OPERADOR"]);

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

const maskEmail = (email?: string | null): string => {
  if (!email) return "<empty>";
  const [localPart = "", domain = ""] = email.split("@");
  if (!domain) return "***";
  const first = localPart.slice(0, 2);
  return `${first}${"*".repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
};

const digitsOnly = (value?: string): string | null => {
  const digits = (value || "").replace(/\D+/g, "");
  return digits.length > 0 ? digits : null;
};

const normalizePerfil = (value?: string): string => {
  const raw = (value || "OPERADOR")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  const aliasMap: Record<string, string> = {
    ADMINISTRADOR: "ADMIN",
    ADM: "ADMIN",
    ADMIN: "ADMIN",
    OPERADOR: "OPERADOR",
    OPERATOR: "OPERADOR",
    TECNICO: "OPERADOR",
    TECNICA: "OPERADOR",
    TEC: "OPERADOR",
    USUARIO: "OPERADOR",
    USER: "OPERADOR",
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

const validatePayload = (payload: CreateUserPayload) => {
  const email = normalizeEmail(payload.email);
  const password = (payload.password || "").trim();
  const nome = (payload.nome || "").trim() || email;
  const perfil = normalizePerfil(payload.perfil);
  const cpf = digitsOnly(payload.cpf);
  const telefone = digitsOnly(payload.telefone);
  const ativo = normalizeAtivo(payload.ativo);

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(400, "invalid_email", "Field 'email' must be a valid e-mail");
  }

  if (!password || password.length < 6) {
    throw new HttpError(400, "invalid_password", "Field 'password' is required with at least 6 characters");
  }

  if (!PERFIS_VALIDOS.has(perfil)) {
    throw new HttpError(400, "invalid_perfil", "Field 'perfil' must be ADMIN or OPERADOR", {
      allowed: Array.from(PERFIS_VALIDOS),
      received: payload.perfil,
      normalized: perfil,
    });
  }

  return {
    email,
    password,
    nome,
    perfil,
    cpf,
    telefone,
    ativo,
  };
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
    searchedEmail: maskEmail(email),
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
    return new Response(JSON.stringify({ requestId, success: true }), { headers: jsonHeaders, status: 200 });
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
    });

    const {
      data: { user: requesterUser },
      error: requesterError,
    } = await supabaseAdmin.auth.getUser(token);

    if (requesterError || !requesterUser?.id) {
      throw new HttpError(401, "invalid_token", "Provided token is invalid or expired", {
        message: requesterError?.message || null,
      });
    }

    let payload: CreateUserPayload;
    try {
      payload = await req.json();
    } catch {
      throw new HttpError(400, "invalid_payload", "Request body must be valid JSON");
    }

    const validated = validatePayload(payload);

    console.log("[create-user] request:start", {
      requestId,
      requesterAuthUserId: requesterUser.id,
      email: maskEmail(validated.email),
      perfil: validated.perfil,
      ativo: validated.ativo,
      payloadKeys: Object.keys(payload || {}),
    });

    await ensureCallerIsAdmin(supabaseAdmin, requesterUser.id, requestId);

    let authUser = await findAuthUserByEmail(supabaseAdmin, validated.email, requestId);

    if (!authUser?.id) {
      const { data: createdUserData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: validated.email,
        password: validated.password,
        email_confirm: true,
        user_metadata: {
          nome: validated.nome,
          perfil: validated.perfil,
          cpf: validated.cpf,
          telefone: validated.telefone,
        },
      });

      if (createErr || !createdUserData?.user?.id) {
        console.error("[create-user] auth.createUser:error", {
          requestId,
          email: maskEmail(validated.email),
          createErrMessage: createErr?.message || null,
          createErrCode: createErr?.code || null,
          createErrStatus: createErr?.status || null,
        });

        authUser = await findAuthUserByEmail(supabaseAdmin, validated.email, requestId);

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
      }
    }

    const usuarioRecord = {
      auth_user_id: authUser.id,
      email: validated.email,
      nome: validated.nome,
      perfil: validated.perfil,
      telefone: validated.telefone,
      cpf: validated.cpf,
      ativo: validated.ativo,
    };

    const { error: upsertError } = await supabaseAdmin
      .from("usuarios")
      .upsert(usuarioRecord, { onConflict: "auth_user_id" });

    if (upsertError) {
      console.error("[create-user] usuarios.upsert:error", {
        requestId,
        email: maskEmail(validated.email),
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
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
      authUserId: authUser.id,
      email: maskEmail(validated.email),
      perfil: validated.perfil,
    });

    return response(201, requestId, {
      success: true,
      message: "User created/updated successfully",
      user: {
        auth_user_id: authUser.id,
        email: validated.email,
        nome: validated.nome,
        perfil: validated.perfil,
        cpf: validated.cpf,
        telefone: validated.telefone,
        ativo: validated.ativo,
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
