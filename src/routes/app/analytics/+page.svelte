<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { formatNumber } from '$lib/utils/helpers.js';
  import type { DailyProfileStat, DailyLinkStat } from '$lib/types.js';

  let { data } = $props();

  const profile = $derived(data.profile);
  const isPro = $derived(profile?.plan === 'PRO');
  const stats = $derived((data.stats ?? []) as DailyProfileStat[]);
  const linkStats = $derived((data.linkStats ?? []) as DailyLinkStat[]);
  const links = $derived(
    (data.links ?? []) as Array<{ id: string; title: string }>
  );
  const range = $derived(data.range ?? 7);

  const totalViews = $derived(
    stats.reduce((s: number, d: DailyProfileStat) => s + d.views, 0)
  );
  const totalUniques = $derived(
    stats.reduce((s: number, d: DailyProfileStat) => s + d.uniques, 0)
  );
  const totalClicks = $derived(
    stats.reduce((s: number, d: DailyProfileStat) => s + d.clicks, 0)
  );
  const ctr = $derived(
    totalViews > 0
      ? ((totalClicks / totalViews) * 100).toFixed(1)
      : '0'
  );

  // Per-link click totals
  const linkClickTotals = $derived(() => {
    const map = new Map<string, number>();
    linkStats.forEach((s: DailyLinkStat) => {
      map.set(s.link_id, (map.get(s.link_id) ?? 0) + s.clicks);
    });
    return links
      .map((l: { id: string; title: string }) => ({
        ...l,
        clicks: map.get(l.id) ?? 0,
      }))
      .sort(
        (a: { clicks: number }, b: { clicks: number }) =>
          b.clicks - a.clicks
      );
  });

  function setRange(days: number) {
    goto(`/app/analytics?range=${days}`, { invalidateAll: true });
  }
</script>

<svelte:head>
  <title>Analytics — Lnksy</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-lg font-semibold text-gray-900">Analytics</h1>
  <div class="flex gap-2">
    <Button
      size="sm"
      variant={range === 7 ? 'primary' : 'ghost'}
      onclick={() => setRange(7)}
    >
      7 days
    </Button>
    {#if isPro}
      <Button
        size="sm"
        variant={range === 30 ? 'primary' : 'ghost'}
        onclick={() => setRange(30)}
      >
        30 days
      </Button>
    {:else}
      <Button size="sm" variant="ghost" disabled>
        30d (Pro)
      </Button>
    {/if}
  </div>
</div>

<!-- Summary cards -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  <Card>
    <p class="text-xs text-gray-500">Views</p>
    <p class="text-2xl font-bold text-gray-900 mt-1">
      {formatNumber(totalViews)}
    </p>
  </Card>
  <Card>
    <p class="text-xs text-gray-500">Unique visitors</p>
    <p class="text-2xl font-bold text-gray-900 mt-1">
      {formatNumber(totalUniques)}
    </p>
  </Card>
  <Card>
    <p class="text-xs text-gray-500">Clicks</p>
    <p class="text-2xl font-bold text-gray-900 mt-1">
      {formatNumber(totalClicks)}
    </p>
  </Card>
  <Card>
    <p class="text-xs text-gray-500">CTR</p>
    <p class="text-2xl font-bold text-gray-900 mt-1">{ctr}%</p>
  </Card>
</div>

<!-- Daily chart (simple bar visualization) -->
<Card class="mb-6">
  <h2 class="text-sm font-medium text-gray-900 mb-4">
    Daily views
  </h2>
  {#if stats.length === 0}
    <p class="text-sm text-gray-400 text-center py-8">
      No data yet. Share your link to start tracking!
    </p>
  {:else}
    <div class="flex items-end gap-1 h-32">
      {#each stats as day}
        {@const maxViews = Math.max(
          ...stats.map((s: DailyProfileStat) => s.views),
          1
        )}
        {@const height = (day.views / maxViews) * 100}
        <div
          class="flex-1 bg-indigo-200 hover:bg-indigo-400
            rounded-t transition-colors cursor-default"
          style="height: {height}%"
          title="{day.date}: {day.views} views"
        ></div>
      {/each}
    </div>
    <div class="flex justify-between mt-2 text-[10px] text-gray-400">
      <span>{stats[0]?.date}</span>
      <span>{stats[stats.length - 1]?.date}</span>
    </div>
  {/if}
</Card>

<!-- Top links (Pro) -->
{#if isPro}
  <Card>
    <h2 class="text-sm font-medium text-gray-900 mb-4">
      Top links
    </h2>
    {@const topLinks = linkClickTotals()}
    {#if topLinks.length === 0}
      <p class="text-sm text-gray-400">No click data yet.</p>
    {:else}
      <div class="space-y-3">
        {#each topLinks.slice(0, 10) as link}
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 truncate flex-1
              mr-4">
              {link.title}
            </span>
            <span class="text-sm font-medium text-gray-900
              tabular-nums">
              {formatNumber(link.clicks)} clicks
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
{:else}
  <Card>
    <div class="text-center py-4">
      <p class="text-sm text-gray-500">
        Per-link analytics available with Pro.
      </p>
      <a
        href="/app/billing"
        class="text-sm text-indigo-600 font-medium underline mt-1
          inline-block"
      >
        Upgrade
      </a>
    </div>
  </Card>
{/if}
