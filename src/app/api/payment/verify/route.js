import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required', success: false },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      return NextResponse.json(
        {
          message: 'Payment verified successfully',
          success: true,
          paymentIntent: session.payment_intent,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: 'Payment not completed',
          success: false,
          paymentStatus: session.payment_status,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Stripe verification error:', error);
    return NextResponse.json(
      { message: 'Payment verification failed', success: false, error: error.message },
      { status: 500 }
    );
  }
}
