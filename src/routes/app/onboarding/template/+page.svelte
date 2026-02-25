<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/Button.svelte';
  import type { TemplateMeta } from '$lib/types.js';
  import {
    LayoutList,
    Music,
    Film,
    Briefcase,
    MapPin,
    ShoppingBag,
    GraduationCap,
  } from '@lucide/svelte';

  let { data } = $props();

  const TEMPLATE_ICONS: Record<string, any> = {
    minimal:          LayoutList,
    musician:         Music,
    'content-creator': Film,
    portfolio:        Briefcase,
    local:            MapPin,
    shop:             ShoppingBag,
    coach:            GraduationCap,
  };

  const TEMPLATE_ICON_COLORS: Record<string, string> = {
    minimal:          'text-slate-400',
    musician:         'text-purple-400',
    'content-creator': 'text-red-400',
    portfolio:        'text-blue-400',
    local:            'text-emerald-400',
    shop:             'text-pink-400',
    coach:            'text-amber-400',
  };

  const TEMPLATE_ICON_BG: Record<string, string> = {
    minimal:          'bg-slate-100',
    musician:         'bg-purple-50',
    'content-creator': 'bg-red-50',
    portfolio:        'bg-blue-50',
    local:            'bg-emerald-50',
    shop:             'bg-pink-50',
    coach:            'bg-amber-50',
  };

  const templates = $derived(data.templates as TemplateMeta[]);

  let selectedId = $state<string | null>(null);
  let loading = $state(false);
  let skipping = $state(false);
</script>

<svelte:head>
  <title>Choose a template — Lnksy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-12">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
      <h1 class="mt-4 text-xl font-semibold text-gray-900">
        Choose a template
      </h1>
      <p class="mt-2 text-sm text-gray-500">
        Pick a starting point — you can customize everything afterwards.
      </p>
    </div>

    <!-- Template grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {#each templates as template (template.id)}
        {@const isSelected = selectedId === template.id}
        {@const IconComp = TEMPLATE_ICONS[template.id]}
        {@const iconColor = TEMPLATE_ICON_COLORS[template.id] ?? 'text-gray-400'}
        {@const iconBg = TEMPLATE_ICON_BG[template.id] ?? 'bg-gray-100'}
        <button
          type="button"
          onclick={() => {
            selectedId = isSelected ? null : template.id;
          }}
          class="group text-left flex items-start gap-4 bg-white rounded-2xl border
            p-4 transition-all duration-150 active:scale-[0.98] cursor-pointer
            {isSelected
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-md'}"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-xl {iconBg} flex items-center justify-center shrink-0 mt-0.5">
            {#if IconComp}
              <svelte:component this={IconComp} class="w-5 h-5 {iconColor}" strokeWidth={1.5} />
            {/if}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-gray-900">{template.name}</p>
              {#if isSelected}
                <svg
                  class="w-4 h-4 text-indigo-600 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0
                       00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414
                       1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </div>
            <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {template.description}
            </p>
            <p class="text-[11px] text-indigo-600 font-medium mt-1">
              {template.bestFor}
            </p>
          </div>
        </button>
      {/each}
    </div>

    <!-- Actions -->
    <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      {#if selectedId}
        <p class="text-xs text-center text-gray-500">
          Ready to apply <strong>{templates.find(t => t.id === selectedId)?.name}</strong>
        </p>
      {:else}
        <p class="text-xs text-center text-gray-400">
          No template selected — we'll apply <strong>Minimal</strong> by default.
        </p>
      {/if}

      <!-- Apply selected -->
      <form
        method="POST"
        action="?/apply"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
      >
        <input type="hidden" name="templateId" value={selectedId ?? 'minimal'} />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          class="w-full"
          {loading}
        >
          {selectedId ? 'Apply template' : 'Continue with Minimal'}
        </Button>
      </form>

      <!-- Skip (applies minimal) -->
      <form
        method="POST"
        action="?/apply"
        use:enhance={() => {
          skipping = true;
          return async ({ update }) => {
            skipping = false;
            await update();
          };
        }}
      >
        <input type="hidden" name="templateId" value="minimal" />
        <button
          type="submit"
          disabled={skipping || loading}
          class="w-full text-center text-xs text-gray-400 hover:text-gray-600
            py-2 transition-colors disabled:opacity-50"
        >
          {skipping ? 'Setting up…' : 'Skip — I'll set it up myself'}
        </button>
      </form>
    </div>
  </div>
</div>
