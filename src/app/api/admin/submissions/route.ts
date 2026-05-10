import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName, isAdminSessionValid, supabaseRest } from "@/lib/supabase";

export async function DELETE() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Neispravna admin lozinka." }, { status: 401 });
  }

  try {
    await supabaseRest("submissions?id=not.is.null", {
      method: "DELETE",
      prefer: "return=minimal"
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete submissions failed", error);
    return NextResponse.json({ error: "Brisanje predaja nije uspjelo." }, { status: 400 });
  }
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(getAdminSessionCookieName())?.value);
}
