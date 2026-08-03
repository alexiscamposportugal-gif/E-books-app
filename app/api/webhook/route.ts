import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generarToken } from "@/lib/licencia";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const cuerpo = await req.text();
  const firma = req.headers.get("stripe-signature")!;

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Firma de webhook inválida:", err.message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object as Stripe.Checkout.Session;
    const bookId = session.metadata?.bookId;
    const email = session.metadata?.email || session.customer_email;

    if (bookId && email) {
      // 1) Crear la fila de licencia (aún sin token, lo añadimos después de tener el id)
      const { data: licencia, error } = await supabaseAdmin
        .from("licenses")
        .insert({
          book_id: bookId,
          buyer_email: email,
          access_token: "temp", // se reemplaza justo abajo
          stripe_session_id: session.id,
        })
        .select()
        .single();

      if (!error && licencia) {
        // 2) Generar el token firmado, ahora que ya existe el id de licencia
        const token = generarToken({ licenseId: licencia.id, bookId, email });

        await supabaseAdmin.from("licenses").update({ access_token: token }).eq("id", licencia.id);

        // 3) Aquí enviarías el correo con el enlace de acceso.
        // Enlace final que recibe el comprador:
        const enlaceAcceso = `${process.env.NEXT_PUBLIC_APP_URL}/libro/${bookId}?token=${token}`;
        console.log("Enviar por correo a", email, ":", enlaceAcceso);
        // TODO: integrar un proveedor de email gratuito, ver README ("Próximos pasos").
      }
    }
  }

  return NextResponse.json({ received: true });
}
