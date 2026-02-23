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

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: jsonHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return response(500, requestId, {
        error: "missing_env",
        message: "Required Supabase environment variables are not configured",
      });
    }

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
    const token = bearerMatch?.[1]?.trim();

    if (!token) {
      return response(401, requestId, {
        error: "missing_token",
        message: "Authorization Bearer token is required",
      });
    }

    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (authResponse.status !== 200) {
      return response(401, requestId, {
        error: "invalid_token",
        message: "Provided token is invalid or expired",
      });
    }

    const authUser = await authResponse.json();
    const requesterId: string | undefined = authUser?.id;

    if (!requesterId) {
      return response(401, requestId, {
        error: "invalid_token",
        message: "Token validation succeeded but user id is missing",
      });
    }

    let payload: CreateUserPayload;
    try {
      payload = await req.json();
    } catch {
      return response(400, requestId, {
        error: "invalid_json",
        message: "Request body must be valid JSON",
      });
    }

    const email = payload?.email?.trim();
    const password = payload?.password;

    if (!email || !password) {
      return response(400, requestId, {
        error: "invalid_body",
        message: "Fields 'email' and 'password' are required",
      });
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
      return response(500, requestId, {
        error: "admin_check_failed",
        message: requesterError.message,
      });
    }

    const isAdmin = [requesterRow?.perfil, requesterRow?.role]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toUpperCase() === "ADMIN");

    if (!isAdmin) {
      return response(403, requestId, {
        error: "forbidden",
        message: "Only ADMIN users can create new users",
      });
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !createdUser?.user?.id) {
      return response(400, requestId, {
        error: "create_user_failed",
        message: createError?.message ?? "Could not create user",
      });
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
      return response(500, requestId, {
        error: "sync_usuario_failed",
        message: upsertError.message,
        user: createdUser.user,
      });
    }

    return response(201, requestId, {
      success: true,
      user: createdUser.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return response(500, requestId, {
      error: "internal_error",
      message,
    });
  }
});
