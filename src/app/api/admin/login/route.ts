import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createAdminSessionToken, getAdminSessionCookieName, isAdminPasswordValid } from "@/lib/supabase";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Previše pokušaja. Pokušajte kasnije." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!isAdminPasswordValid(body?.password ?? null)) {
    return NextResponse.json({ error: "Neispravna admin lozinka." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminSessionCookieName(), await createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/"
  });
  return response;
}
