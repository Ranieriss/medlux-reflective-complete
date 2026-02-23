import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateUserPayload = {
  email?: string;
  password?: string;
  nome?: string;
  perfil?: string;
  role?: string;
};

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

const response = (
  status: number,
  requestId: string,
  body: Record<string, unknown>,
): Response => {
  return new Response(
    JSON.stringify({ requestId, ...body }),
    { status, headers: jsonHeaders },
  );
};

const getRequestId = (req: Request): string => {
  return req.headers.get("x-sb-request-id") || crypto.randomUUID();
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
      throw new Error("Required Supabase environment variables are not configured");
    }

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
    const token = bearerMatch?.[1]?.trim();

    let payload: CreateUserPayload;
    try {
      payload = await req.json();
    } catch {
      throw new HttpError(400, "invalid_payload", "Request body must be valid JSON");
    }

    const payloadKeys = Object.keys(payload ?? {});
    console.log("[create-user] request start", {
      requestId,
      payloadKeys,
      hasAuthorizationHeader: Boolean(authHeader),
    });

    if (!token) {
      throw new HttpError(401, "missing_authorization", "Authorization Bearer token is required");
    }

    console.log("[create-user] validating token:before", { requestId });
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (authResponse.status !== 200) {
      throw new HttpError(401, "invalid_token", "Provided token is invalid or expired");
    }

    const authUser = await authResponse.json();
    const requesterId: string | undefined = authUser?.id;

    console.log("[create-user] validating token:after", {
      requestId,
      requesterId,
    });

    if (!requesterId) {
      throw new HttpError(401, "invalid_token", "Token validation succeeded but user id is missing");
    }

    const email = payload?.email?.trim();
    const password = payload?.password;

    if (!email || !password) {
      throw new HttpError(400, "invalid_payload", "Fields 'email' and 'password' are required");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requesterRow, error: requesterError } = await supabaseAdmin
      .from("usuarios")
      .select("id, perfil, role")
      .eq("id", requesterId)
      .maybeSingle();

    if (requesterError) {
      throw new Error(`Admin permission lookup failed: ${requesterError.message}`);
    }

    const isAdmin = [requesterRow?.perfil, requesterRow?.role]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toUpperCase() === "ADMIN");

    if (!isAdmin) {
      throw new HttpError(403, "forbidden", "Only ADMIN users can create new users");
    }

    console.log("[create-user] admin.createUser:before", { requestId, email });
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    console.log("[create-user] admin.createUser:after", {
      requestId,
      userId: createdUser?.user?.id ?? null,
      hasError: Boolean(createError),
    });

    if (createError || !createdUser?.user?.id) {
      throw new HttpError(400, "invalid_payload", createError?.message ?? "Could not create user");
    }

    const newUserId = createdUser.user.id;
    const nome = payload.nome?.trim() || email;
    const perfil = (payload.perfil || payload.role || "USUARIO").toUpperCase();

    const { error: upsertError } = await supabaseAdmin
      .from("usuarios")
      .upsert(
        {
          id: newUserId,
          email,
          nome,
          perfil,
          role: perfil,
        },
        { onConflict: "id" },
      );

    if (upsertError) {
      throw new Error(`usuarios upsert failed: ${upsertError.message}`);
    }

    return response(201, requestId, {
      success: true,
      user: createdUser.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const stack = error instanceof Error ? error.stack : undefined;

    console.error("[create-user] request failed", {
      requestId,
      message,
      stack,
    });

    if (error instanceof HttpError) {
      return response(error.status, requestId, {
        error: error.code,
        message: error.message,
      });
    }

    return response(500, requestId, {
      error: "internal_error",
    });
  }
});
