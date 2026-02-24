import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PERFIS, PERFIS_VALIDOS, normalizePerfil } from "../_shared/roles.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
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
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const getRequestId = (req: Request): string => req.headers.get("x-request-id") || crypto.randomUUID();

const respond = (status: number, requestId: string, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify({ requestId, ...body }), { status, headers: corsHeaders });

const parseBearerToken = (authHeader: string | null): string | null => {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const normalizeEmail = (value?: string): string => (value || "").trim().toLowerCase();

const digitsOnly = (value?: string): string | null => {
  const digits = (value || "").replace(/\D+/g, "");
  return digits || null;
};

const normalizeAtivo = (value: CreateUserPayload["ativo"]): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return ["1", "true", "sim", "yes", "ativo"].includes(value.trim().toLowerCase());
  return true;
};

const validatePayload = (payload: CreateUserPayload) => {
  const email = normalizeEmail(payload.email);
  const password = (payload.password || "").trim();
  const nome = (payload.nome || "").trim() || email;
  const perfil = normalizePerfil(payload.perfil);

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
    cpf: digitsOnly(payload.cpf),
    telefone: digitsOnly(payload.telefone),
    ativo: normalizeAtivo(payload.ativo),
  };
};

const ensureCallerIsAdmin = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  requesterAuthUserId: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("auth_user_id, perfil, ativo")
    .eq("auth_user_id", requesterAuthUserId)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "admin_lookup_failed", "Failed to validate admin permissions", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  if (normalizePerfil((data?.perfil as string | undefined) || "") !== PERFIS.ADMIN) {
    throw new HttpError(403, "forbidden", "Only ADMIN users can create new users");
  }
};

Deno.serve(async (req) => {
  const requestId = getRequestId(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST method is allowed");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(500, "missing_env", "Required environment variables are not configured");
    }

    const token = parseBearerToken(req.headers.get("authorization") || req.headers.get("Authorization"));
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

    const payload = await req.json() as CreateUserPayload;
    const validated = validatePayload(payload);

    await ensureCallerIsAdmin(supabaseAdmin, requesterUser.id);

    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
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

    const authUserId = createData?.user?.id;

    if (createError && !createError.message?.toLowerCase().includes("already") && !createError.message?.toLowerCase().includes("registered")) {
      throw new HttpError(500, "auth_create_user_failed", "Failed to create auth user", {
        message: createError.message,
        code: createError.code,
        status: createError.status,
      });
    }

    let resolvedAuthUserId = authUserId;
    if (!resolvedAuthUserId) {
      const getByEmailApi = supabaseAdmin.auth.admin as { getUserByEmail?: (email: string) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> };
      if (typeof getByEmailApi.getUserByEmail === "function") {
        const { data: userByEmail, error: byEmailError } = await getByEmailApi.getUserByEmail(validated.email);
        if (byEmailError || !userByEmail?.user?.id) {
          throw new HttpError(500, "auth_lookup_failed", "Auth user exists but could not be resolved by e-mail", {
            message: byEmailError?.message || null,
          });
        }
        resolvedAuthUserId = userByEmail.user.id;
      }
    }

    if (!resolvedAuthUserId) {
      throw new HttpError(500, "auth_user_id_missing", "Auth user id could not be resolved");
    }

    const { error: upsertError } = await supabaseAdmin
      .from("usuarios")
      .upsert({
        auth_user_id: resolvedAuthUserId,
        email: validated.email,
        nome: validated.nome,
        perfil: validated.perfil,
        cpf: validated.cpf,
        telefone: validated.telefone,
        ativo: validated.ativo,
      }, { onConflict: "auth_user_id" });

    if (upsertError) {
      throw new HttpError(500, "usuarios_upsert_failed", "Auth user was created, but failed to upsert public.usuarios", {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
      });
    }

    return respond(200, requestId, {
      ok: true,
      data: {
        auth_user_id: resolvedAuthUserId,
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
    const details = isHttpError ? error.details : { rawError: String(error) };

    console.error("[create-user] failed", {
      requestId,
      status,
      error: isHttpError ? error.code : "internal_error",
      details,
      stack: error instanceof Error ? error.stack : null,
    });

    return respond(status, requestId, {
      ok: false,
      error: isHttpError ? error.code : "internal_error",
      details,
    });
  }
});
