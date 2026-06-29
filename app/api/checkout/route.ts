import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { guestId, email, name } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      allow_promotion_codes: true,
      metadata: {
        guestId,
        name,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "KIDA Rooftop Party Ticket",
            },
            unit_amount: 5000,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true&guest=${guestId}&name=${encodeURIComponent(
        name
      )}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Checkout failed" },
      { status: 500 }
    );
  }
}