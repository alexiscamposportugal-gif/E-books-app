import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const claveRecibida = req.headers.get("x-admin-secret");
  if (!claveRecibida || claveRecibida !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { nombreArchivo, carpeta } = await req.json();
  const bucket = carpeta === "pdf" ? "libros-pdf" : "portadas";
  const rutaSegura = `${crypto.randomUUID()}-${(nombreArchivo || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(rutaSegura);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "No se pudo preparar la subida" }, { status: 500 });
  }

  return NextResponse.json({ ruta: rutaSegura, token: data.token, bucket });
}
