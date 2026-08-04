import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Falta session_id" }, { status: 400 });
  }

  const { data: licencia } = await supabaseAdmin
    .from("licenses")
    .select("book_id, access_token")
    .eq("stripe_session_id", sessionId)
    .single();

  if (!licencia) {
    // Todavía no llega el webhook de Stripe, o el pago no generó licencia.
    return NextResponse.json({ enlace: null });
  }

  const enlace = `${process.env.NEXT_PUBLIC_APP_URL}/libro/${licencia.book_id}?token=${licencia.access_token}`;
  return NextResponse.json({ enlace });
}
