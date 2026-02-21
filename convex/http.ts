import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

// =============================================================
// Lnksy — HTTP Routes
// =============================================================

const http = httpRouter();

/**
 * Stripe Webhook Handler
 * Ruta: POST /stripe/webhook
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing Stripe signature", {
        status: 400,
      });
    }

    let event: any;
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-06-20",
      });
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error(
        "Stripe webhook signature verification failed:",
        err.message,
      );
      return new Response(`Webhook Error: ${err.message}`, {
        status: 400,
      });
    }

    const alreadyProcessed = await ctx.runQuery(
      internal.billing.isWebhookProcessed,
      { eventId: event.id },
    );
    if (alreadyProcessed) {
      return Response.json({ received: true, duplicate: true });
    }

    await ctx.runMutation(internal.billing.markWebhookProcessed, {
      eventId: event.id,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          await ctx.runMutation(
            internal.billing.onCheckoutCompleted,
            {
              ownerId: userId,
              subscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
            },
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        await ctx.runMutation(
          internal.billing.onSubscriptionUpdated,
          {
            stripeCustomerId: sub.customer as string,
            status: sub.status as string,
            currentPeriodEnd: sub.current_period_end * 1000,
          },
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await ctx.runMutation(
          internal.billing.onSubscriptionDeleted,
          {
            stripeCustomerId: sub.customer as string,
          },
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await ctx.runMutation(internal.billing.onPaymentFailed, {
          stripeCustomerId: invoice.customer as string,
        });
        break;
      }

      default:
        console.log(
          `Unhandled Stripe event type: ${event.type}`,
        );
    }

    return Response.json({ received: true });
  }),
});

/**
 * Track endpoint
 * Ruta: POST /track
 */
http.route({
  path: "/track",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const { type, profileId, linkId, anonId, contactType } = body;

    if (!profileId || !anonId) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 },
      );
    }

    if (type === "page_view") {
      await ctx.runMutation(api.analytics.trackPageView, {
        profileId,
        anonId,
      });
      return Response.json({ ok: true });
    }

    if (type === "link_click") {
      if (!linkId) {
        return Response.json(
          { error: "Missing linkId" },
          { status: 400 },
        );
      }
      await ctx.runMutation(api.analytics.trackLinkClick, {
        profileId,
        linkId,
      });
      return Response.json({ ok: true });
    }

    if (type === "contact_click") {
      if (!contactType) {
        return Response.json(
          { error: "Missing contactType" },
          { status: 400 },
        );
      }
      await ctx.runMutation(api.analytics.trackContactClick, {
        profileId,
        contactType,
      });
      return Response.json({ ok: true });
    }

    return Response.json(
      { error: "Invalid type" },
      { status: 400 },
    );
  }),
});

export default http;
