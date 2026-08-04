import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { bookId, claveAdmin } = await req.json();

  if (!claveAdmin || claveAdmin !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ valido: false, motivo: "Clave de administrador incorrecta" }, { status: 401 });
  }

  const { data: libro } = await supabaseAdmin
    .from("books")
    .select("title, status, interactive_content")
    .eq("id", bookId)
    .single();

  if (!libro) {
    return NextResponse.json({ valido: false, motivo: "Libro no encontrado" }, { status: 404 });
  }

  if (libro.status !== "ready") {
    return NextResponse.json({ valido: false, motivo: `El libro todavía está en estado: ${libro.status}` }, { status: 409 });
  }

  return NextResponse.json({ valido: true, libro });
}
