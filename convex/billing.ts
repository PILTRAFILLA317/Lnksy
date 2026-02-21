import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Billing
// Equivalente a public.billing + public.stripe_webhook_events
// + el webhook handler de /api/billing/webhook
// =============================================================

// ─── Queries ─────────────────────────────────────────────────

/** Billing del usuario autenticado — equivale al SELECT en /app/billing */
export const getOwn = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("billing")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
  },
});

/** Buscar billing por stripe customer ID (internal) */
export const getByStripeCustomer = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("billing")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId),
      )
      .first();
  },
});

/** Verificar idempotencia del webhook (internal) */
export const isWebhookProcessed = internalQuery({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const existing = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", eventId))
      .first();
    return !!existing;
  },
});

// ─── Internal mutations (llamadas desde http.ts) ──────────────

/** Registrar webhook como procesado — equivale al INSERT en stripe_webhook_events */
export const markWebhookProcessed = internalMutation({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    await ctx.db.insert("stripeWebhookEvents", {
      eventId,
      receivedAt: Date.now(),
    });
  },
});

/**
 * checkout.session.completed
 * Equivale al case en el webhook handler:
 * billing UPDATE (subscription_id, stripe_customer_id, status='active', plan='PRO')
 * + profiles UPDATE (plan='PRO')
 */
export const onCheckoutCompleted = internalMutation({
  args: {
    ownerId: v.string(),
    subscriptionId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { ownerId, subscriptionId, stripeCustomerId }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();

    if (billing) {
      await ctx.db.patch(billing._id, {
        subscriptionId,
        stripeCustomerId,
        status: "active",
        plan: "PRO",
        updatedAt: Date.now(),
      });
    } else {
      // Crear registro de billing si no existe
      await ctx.db.insert("billing", {
        ownerId,
        subscriptionId,
        stripeCustomerId,
        status: "active",
        plan: "PRO",
        updatedAt: Date.now(),
      });
    }

    await ctx.runMutation(internal.profiles.updatePlan, {
      ownerId,
      plan: "PRO",
    });
  },
});

/**
 * customer.subscription.updated
 * Equivale al case en el webhook handler:
 * billing UPDATE (status, plan, current_period_end)
 * + profiles UPDATE (plan)
 */
export const onSubscriptionUpdated = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),  // Unix ms
  },
  handler: async (ctx, { stripeCustomerId, status, currentPeriodEnd }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId),
      )
      .first();

    if (!billing) return;

    const isActive = status === "active" || status === "trialing";
    const plan = isActive ? "PRO" : "FREE";

    await ctx.db.patch(billing._id, {
      status: status as any,
      plan,
      currentPeriodEnd,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.profiles.updatePlan, {
      ownerId: billing.ownerId,
      plan,
    });
  },
});

/**
 * customer.subscription.deleted
 * Equivale al case en el webhook handler:
 * billing UPDATE (status='canceled', plan='FREE', subscription_id=null, current_period_end=null)
 * + profiles UPDATE (plan='FREE')
 */
export const onSubscriptionDeleted = internalMutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId),
      )
      .first();

    if (!billing) return;

    await ctx.db.patch(billing._id, {
      status: "canceled",
      plan: "FREE",
      subscriptionId: undefined,
      currentPeriodEnd: undefined,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.profiles.updatePlan, {
      ownerId: billing.ownerId,
      plan: "FREE",
    });
  },
});

/**
 * invoice.payment_failed
 * Equivale al case en el webhook handler:
 * billing UPDATE (status='past_due')
 */
export const onPaymentFailed = internalMutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId),
      )
      .first();

    if (billing) {
      await ctx.db.patch(billing._id, {
        status: "past_due",
        updatedAt: Date.now(),
      });
    }
  },
});

// ─── Mutations accesibles desde el servidor SvelteKit ──────────

/**
 * Crear o verificar registro de billing para un usuario.
 * Se llama antes de crear una sesión de checkout de Stripe.
 */
export const ensureBillingRecord = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("billing")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();

    if (existing) return existing._id;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();

    return await ctx.db.insert("billing", {
      ownerId: userId,
      profileId: profile?._id,
      plan: "FREE",
      status: "inactive",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Guardar Stripe customer ID en el billing record.
 * Se llama desde la ruta /api/billing/checkout antes de crear la sesión.
 */
export const setStripeCustomer = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { userId, stripeCustomerId }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();

    if (!billing) throw new ConvexError("Billing record not found");

    if (!billing.stripeCustomerId) {
      await ctx.db.patch(billing._id, {
        stripeCustomerId,
        updatedAt: Date.now(),
      });
    }

    return billing.stripeCustomerId ?? stripeCustomerId;
  },
});
