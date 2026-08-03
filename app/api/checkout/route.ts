import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { bookId, email } = await req.json();

    const { data: libro } = await supabaseAdmin
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (!libro || libro.status !== "ready") {
      return NextResponse.json({ error: "Libro no disponible" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: libro.currency,
            product_data: { name: libro.title },
            unit_amount: libro.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: { bookId, email },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/comprar/${bookId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creando checkout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
