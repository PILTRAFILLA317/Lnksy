<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import type { Billing } from '$lib/types.js';

  let { data } = $props();

  let loading = $state(false);

  const profile = $derived(data.profile);
  const billing = $derived(data.billing as Billing | null);
  const isPro = $derived(profile?.plan === 'PRO');
  const isActive = $derived(
    billing?.status === 'active' || billing?.status === 'trialing'
  );

  const features = {
    free: [
      '1 profile',
      'Up to 25 links',
      '3 free themes',
      'Basic analytics (7 days)',
      'Lnksy branding',
    ],
    pro: [
      '1 profile',
      'Unlimited links',
      'All 13+ themes',
      'Full analytics (30 days)',
      'Per-link analytics',
      'Custom colors & fonts',
      'Link scheduling',
      'Link highlights',
      'Remove branding',
    ],
  };
</script>

<svelte:head>
  <title>Billing — Lnksy</title>
</svelte:head>

<h1 class="text-lg font-semibold text-gray-900 mb-6">Billing</h1>

{#if isPro && isActive}
  <!-- Active Pro subscription -->
  <Card class="mb-6">
    <div class="flex items-center gap-3 mb-4">
      <span class="bg-indigo-100 text-indigo-700 text-xs font-semibold
        px-2.5 py-1 rounded-full">
        PRO
      </span>
      <span class="text-sm text-green-600 font-medium">Active</span>
    </div>
    <p class="text-sm text-gray-600">
      {#if billing?.current_period_end}
        Next billing date:
        {new Date(billing.current_period_end).toLocaleDateString()}
      {/if}
    </p>
    <form method="POST" action="?/portal" use:enhance class="mt-4">
      <Button type="submit" variant="outline" size="sm">
        Manage subscription
      </Button>
    </form>
  </Card>
{:else}
  <!-- Pricing cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <!-- Free -->
    <Card class="{!isPro ? 'ring-2 ring-indigo-600' : ''}">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Free</h2>
        <p class="text-3xl font-bold text-gray-900 mt-2">
          $0
          <span class="text-sm font-normal text-gray-500">/month</span>
        </p>
      </div>
      <ul class="space-y-2 mb-6">
        {#each features.free as feature}
          <li class="flex items-center gap-2 text-sm text-gray-600">
            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        {/each}
      </ul>
      {#if !isPro}
        <Button variant="secondary" size="md" class="w-full" disabled>
          Current plan
        </Button>
      {/if}
    </Card>

    <!-- Pro -->
    <Card class="{isPro ? 'ring-2 ring-indigo-600' : ''}">
      <div class="mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-gray-900">Pro</h2>
          <span class="bg-indigo-100 text-indigo-700 text-[10px]
            font-semibold px-2 py-0.5 rounded-full">
            POPULAR
          </span>
        </div>
        <p class="text-3xl font-bold text-gray-900 mt-2">
          $5
          <span class="text-sm font-normal text-gray-500">/month</span>
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          or $48/year (save 20%)
        </p>
      </div>
      <ul class="space-y-2 mb-6">
        {#each features.pro as feature}
          <li class="flex items-center gap-2 text-sm text-gray-600">
            <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        {/each}
      </ul>
      {#if !isPro}
        <div class="space-y-2">
          <form
            method="POST"
            action="?/checkout&period=monthly"
            use:enhance={() => {
              loading = true;
              return async ({ update }) => {
                loading = false;
                await update();
              };
            }}
          >
            <Button
              type="submit"
              variant="primary"
              size="md"
              class="w-full"
              {loading}
            >
              Upgrade — $5/month
            </Button>
          </form>
          <form
            method="POST"
            action="?/checkout&period=yearly"
            use:enhance={() => {
              loading = true;
              return async ({ update }) => {
                loading = false;
                await update();
              };
            }}
          >
            <Button
              type="submit"
              variant="outline"
              size="md"
              class="w-full"
              {loading}
            >
              Upgrade — $48/year
            </Button>
          </form>
        </div>
      {/if}
    </Card>
  </div>
{/if}
