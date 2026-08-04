import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verificarToken } from "@/lib/licencia";

export async function POST(req: NextRequest) {
  const { token, deviceId } = await req.json();

  const payload = verificarToken(token);
  if (!payload) {
    return NextResponse.json({ valido: false, motivo: "Token inválido" }, { status: 401 });
  }

  const { data: licencia } = await supabaseAdmin
    .from("licenses")
    .select("*")
    .eq("id", payload.licenseId)
    .eq("access_token", token)
    .single();

  if (!licencia || licencia.revoked) {
    return NextResponse.json({ valido: false, motivo: "Acceso revocado" }, { status: 403 });
  }

  if (licencia.expires_at && new Date(licencia.expires_at) < new Date()) {
    return NextResponse.json({ valido: false, motivo: "Acceso expirado" }, { status: 403 });
  }

  const dispositivos: string[] = licencia.devices_used || [];
  if (!dispositivos.includes(deviceId)) {
    if (dispositivos.length >= licencia.max_devices) {
      return NextResponse.json(
        { valido: false, motivo: "Límite de dispositivos alcanzado" },
        { status: 403 }
      );
    }
    await supabaseAdmin
      .from("licenses")
      .update({ devices_used: [...dispositivos, deviceId] })
      .eq("id", licencia.id);
  }

  const { data: libro } = await supabaseAdmin
    .from("books")
    .select("title, portada_url, interactive_content")
    .eq("id", licencia.book_id)
    .single();

  return NextResponse.json({ valido: true, libro });
}
