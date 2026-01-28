import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const { amount, currency, eventId, eventTitle, userId } = await req.json();

    if (!amount || !currency) {
      return NextResponse.json(
        { message: 'Amount and currency are required' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: eventTitle || 'Event Registration',
              description: `Registration fee for ${eventTitle || 'event'}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to smallest currency unit (cents/paise)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/events/${eventId}?payment=cancelled`,
      metadata: {
        eventId: eventId,
        userId: userId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    }, { status: 200 });

  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { message: 'Failed to create checkout session', error: error.message },
      { status: 500 }
    );
  }
}
