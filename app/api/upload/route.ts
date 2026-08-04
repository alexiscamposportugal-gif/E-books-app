import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generarContenidoInteractivo } from "@/lib/generarInteractivo";

// pdf-parse se importa de forma dinámica dentro de la función para
// evitar problemas de compatibilidad con el entorno serverless.

export async function POST(req: NextRequest) {
  try {
    const claveRecibida = req.headers.get("x-admin-secret");
    if (!claveRecibida || claveRecibida !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const archivo = formData.get("archivo") as File | null;
    const portada = formData.get("portada") as File | null;
    const titulo = (formData.get("titulo") as string) || "Libro sin título";
    const precioCents = parseInt((formData.get("precioCents") as string) || "0", 10);

    if (!archivo) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());

    // 1) Crear el registro del libro en estado "processing"
    const { data: libro, error: errorInsert } = await supabaseAdmin
      .from("books")
      .insert({
        title: titulo,
        original_filename: archivo.name,
        price_cents: precioCents,
        status: "processing",
      })
      .select()
      .single();

    if (errorInsert || !libro) {
      return NextResponse.json(
        { error: "Supabase (crear libro): " + (errorInsert?.message || "error desconocido") },
        { status: 500 }
      );
    }

    // 1.1) Si se subió una imagen de portada, guardarla en Supabase Storage
    if (portada && portada.size > 0) {
      const extension = portada.name.split(".").pop() || "jpg";
      const rutaPortada = `${libro.id}.${extension}`;
      const bufferPortada = Buffer.from(await portada.arrayBuffer());

      const { error: errorSubida } = await supabaseAdmin.storage
        .from("portadas")
        .upload(rutaPortada, bufferPortada, { contentType: portada.type, upsert: true });

      if (!errorSubida) {
        const { data: urlPublica } = supabaseAdmin.storage.from("portadas").getPublicUrl(rutaPortada);
        await supabaseAdmin.from("books").update({ portada_url: urlPublica.publicUrl }).eq("id", libro.id);
      }
      // Si falla la portada no detenemos el proceso: el libro se genera igual, solo sin imagen.
    }

    // 2) Extraer el texto del PDF
    const pdfParse = (await import("pdf-parse")).default;
    const datosExtraidos = await pdfParse(buffer);
    const textoPlano = datosExtraidos.text;

    // 3) Generar el contenido interactivo con IA
    const contenidoInteractivo = await generarContenidoInteractivo(textoPlano);

    // 4) Guardar el resultado y marcar como listo
    await supabaseAdmin
      .from("books")
      .update({ interactive_content: contenidoInteractivo, status: "ready" })
      .eq("id", libro.id);

    return NextResponse.json({ success: true, bookId: libro.id });
  } catch (error: any) {
    console.error("Error procesando el PDF:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 300; // hasta 5 minutos para libros largos
