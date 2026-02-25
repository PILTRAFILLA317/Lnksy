<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import { studio } from '$lib/stores/studio.svelte.js';
  import Modal from '$lib/components/ui/Modal.svelte';
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

  let { data, form } = $props();

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

  const templates = $derived(data.templates as TemplateMeta[]);

  // Modal state
  let selectedTemplate = $state<TemplateMeta | null>(null);
  let confirmOpen = $state(false);
  let applying = $state(false);
  let applied = $state(false);

  function openConfirm(t: TemplateMeta) {
    selectedTemplate = t;
    confirmOpen = true;
  }

  function closeConfirm() {
    if (applying) return;
    confirmOpen = false;
    selectedTemplate = null;
  }

  // Show success toast after applying
  $effect(() => {
    if (form?.success) {
      applied = true;
      confirmOpen = false;
      applying = false;
      const msg =
        (form.savedLinksCount ?? 0) > 0
          ? `Template applied! Your old links were saved in a hidden "Old links" block.`
          : 'Template applied successfully.';
      studio.showToast(msg, 'success');
      invalidateAll();
      // Navigate to editor
      goto('/app');
    } else if (form?.error) {
      applying = false;
      studio.showToast(form.error, 'error');
    }
  });
</script>

<svelte:head>
  <title>Templates — Lnksy</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Templates</h1>
    <p class="mt-1 text-sm text-gray-500">
      Pick a starting point for your page. You can always adjust everything after.
    </p>
  </div>

  <!-- Template grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each templates as template (template.id)}
      {@const IconComp = TEMPLATE_ICONS[template.id]}
      {@const iconColor = TEMPLATE_ICON_COLORS[template.id] ?? 'text-gray-400'}
      <div
        class="group relative flex flex-col bg-white rounded-2xl border
          border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200
          transition-all duration-200 overflow-hidden"
      >
        <!-- Card header / visual -->
        <div
          class="flex items-center justify-center h-28
            bg-gradient-to-br from-gray-50 to-gray-100
            group-hover:from-indigo-50 group-hover:to-indigo-100/50
            transition-colors duration-200"
        >
          {#if IconComp}
            <svelte:component this={IconComp} class="w-10 h-10 {iconColor} group-hover:text-indigo-400 transition-colors duration-200" strokeWidth={1.5} />
          {/if}
        </div>

        <!-- Card body -->
        <div class="p-4 flex flex-col flex-1">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h2 class="text-sm font-semibold text-gray-900">
              {template.name}
            </h2>
            {#if template.isPro}
              <span
                class="shrink-0 text-[10px] font-bold uppercase tracking-wide
                  bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
              >
                PRO
              </span>
            {:else}
              <span
                class="shrink-0 text-[10px] font-medium text-gray-400
                  bg-gray-100 px-2 py-0.5 rounded-full"
              >
                Free
              </span>
            {/if}
          </div>
          <p class="text-xs text-gray-500 leading-relaxed flex-1">
            {template.description}
          </p>
          <p class="mt-2 text-[11px] text-indigo-600 font-medium">
            Best for: {template.bestFor}
          </p>

          <!-- Select button -->
          <button
            onclick={() => openConfirm(template)}
            class="mt-3 w-full py-2 text-xs font-semibold rounded-xl
              bg-indigo-50 text-indigo-700 hover:bg-indigo-100
              border border-indigo-100 hover:border-indigo-200
              transition-all duration-150 active:scale-[0.98]"
          >
            Use this template
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Confirmation modal -->
<Modal
  open={confirmOpen}
  onclose={closeConfirm}
  title="Apply template?"
>
  {#if selectedTemplate}
    <div class="space-y-4">
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        {@const ModalIcon = TEMPLATE_ICONS[selectedTemplate.id]}
        {@const modalIconColor = TEMPLATE_ICON_COLORS[selectedTemplate.id] ?? 'text-gray-400'}
        <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
          {#if ModalIcon}
            <svelte:component this={ModalIcon} class="w-5 h-5 {modalIconColor}" strokeWidth={1.5} />
          {/if}
        </div>
        <div>
          <p class="font-semibold text-gray-900 text-sm">
            {selectedTemplate.name}
          </p>
          <p class="text-xs text-gray-500">{selectedTemplate.bestFor}</p>
        </div>
      </div>

      <!-- What changes -->
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5">
        <p class="text-xs font-semibold text-amber-800 mb-2">
          What changes:
        </p>
        {#each [
          { text: 'Current components are replaced with the template blocks', warn: true },
          { text: 'Existing links are moved to a hidden "Old links" block — not deleted', warn: true },
        ] as item}
          <div class="flex items-start gap-2 text-xs text-amber-700">
            <svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {item.text}
          </div>
        {/each}
      </div>

      <!-- What stays the same -->
      <div class="rounded-xl border border-green-200 bg-green-50 p-4 space-y-1.5">
        <p class="text-xs font-semibold text-green-800 mb-2">
          What stays / is added:
        </p>
        {#each [
          'Avatar, bio, theme and appearance are untouched',
          'Contact buttons are preset (disabled) — edit them in the panel',
        ] as item}
          <div class="flex items-start gap-2 text-xs text-green-700">
            <svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-500" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </div>
        {/each}
      </div>

      <!-- Action buttons -->
      <form
        method="POST"
        action="?/apply"
        use:enhance={() => {
          applying = true;
          return async ({ update }) => {
            await update({ reset: false });
          };
        }}
      >
        <input type="hidden" name="templateId" value={selectedTemplate.id} />
        <div class="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            class="flex-1"
            disabled={applying}
            onclick={closeConfirm}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            class="flex-1"
            loading={applying}
          >
            Apply template
          </Button>
        </div>
      </form>
    </div>
  {/if}
</Modal>
