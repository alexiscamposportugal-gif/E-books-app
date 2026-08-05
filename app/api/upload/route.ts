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

    const { rutaPdf, rutaPortada, titulo, precioCents, nombreOriginal } = await req.json();

    if (!rutaPdf) {
      return NextResponse.json({ error: "Falta la referencia del PDF ya subido" }, { status: 400 });
    }

    // 1) Crear el registro del libro en estado "processing"
    const { data: libro, error: errorInsert } = await supabaseAdmin
      .from("books")
      .insert({
        title: titulo || "Libro sin título",
        original_filename: nombreOriginal || null,
        price_cents: precioCents || 0,
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

    // 1.1) Si se subió una portada, guardar su URL pública
    if (rutaPortada) {
      const { data: urlPublica } = supabaseAdmin.storage.from("portadas").getPublicUrl(rutaPortada);
      await supabaseAdmin.from("books").update({ portada_url: urlPublica.publicUrl }).eq("id", libro.id);
    }

    // 2) Descargar el PDF desde Supabase Storage (ya subido directo desde el navegador)
    const { data: archivoPdf, error: errorDescarga } = await supabaseAdmin.storage
      .from("libros-pdf")
      .download(rutaPdf);

    if (errorDescarga || !archivoPdf) {
      await supabaseAdmin.from("books").update({ status: "failed" }).eq("id", libro.id);
      return NextResponse.json(
        { error: "No se pudo descargar el PDF subido: " + (errorDescarga?.message || "error desconocido") },
        { status: 500 }
      );
    }
    const buffer = Buffer.from(await archivoPdf.arrayBuffer());

    // 3) Extraer el texto del PDF
    const pdfParse = (await import("pdf-parse")).default;
    const datosExtraidos = await pdfParse(buffer);
    const textoPlano = datosExtraidos.text;

    // 4) Generar el contenido interactivo con IA
    const contenidoInteractivo = await generarContenidoInteractivo(textoPlano);

    // 5) Guardar el resultado y marcar como listo
    await supabaseAdmin
      .from("books")
      .update({ interactive_content: contenidoInteractivo, status: "ready" })
      .eq("id", libro.id);

    // El PDF original ya cumplió su función (generar el contenido); se borra
    // del bucket para no ocupar espacio de almacenamiento gratuito innecesariamente.
    await supabaseAdmin.storage.from("libros-pdf").remove([rutaPdf]);

    return NextResponse.json({ success: true, bookId: libro.id });
  } catch (error: any) {
    console.error("Error procesando el PDF:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 300; // hasta 5 minutos para libros largos
