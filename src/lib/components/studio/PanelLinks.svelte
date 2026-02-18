<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import LinkCard from '$lib/components/ui/LinkCard.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { FREE_LINK_LIMIT } from '$lib/types.js';
  import type { Link, LinkSection, Profile, MainLinksLayout } from '$lib/types.js';

  interface Props {
    links: Link[];
    sections: LinkSection[];
    profile: Profile;
    isPro: boolean;
  }

  let { links, sections, profile, isPro }: Props = $props();

  const LAYOUT_OPTIONS: {
    value: MainLinksLayout;
    label: string;
    icon: 'list' | 'grid' | 'grid-img' | 'list-img';
    pro: boolean;
  }[] = [
    { value: 'LIST_ICON', label: 'List', icon: 'list', pro: false },
    { value: 'GRID_ICON', label: 'Grid', icon: 'grid', pro: false },
    { value: 'GRID_IMAGE', label: 'Grid + Img', icon: 'grid-img', pro: true },
    { value: 'LIST_IMAGE', label: 'List + Img', icon: 'list-img', pro: true },
  ];

  // Which section is expanded (shows links + settings)
  let expandedId = $state<string | null>(null);

  // Auto-expand if only one section
  $effect(() => {
    if (sections.length === 1 && expandedId === null) {
      expandedId = sections[0]?.id ?? null;
    }
  });

  function linksForSection(sectionId: string): Link[] {
    return links.filter((l) => l.section_id === sectionId);
  }

  const totalLinkCount = $derived(links.length);
  const canAddLink = $derived(isPro || totalLinkCount < FREE_LINK_LIMIT);
  const linkUsagePercent = $derived(
    Math.min(100, Math.round((totalLinkCount / FREE_LINK_LIMIT) * 100)),
  );

  // Add link modal — tracks which section to add to
  let addToSectionId = $state<string | null>(null);
  let newTitle = $state('');
  let newUrl = $state('');
  let newSubtitle = $state('');

  function openAddModal(sectionId: string) {
    addToSectionId = sectionId;
  }

  function resetAddForm() {
    newTitle = '';
    newUrl = '';
    newSubtitle = '';
    addToSectionId = null;
  }

  // Edit link modal
  let editingLink = $state<Link | null>(null);
  let editTitle = $state('');
  let editUrl = $state('');
  let editSubtitle = $state('');
  let editStartAt = $state('');
  let editEndAt = $state('');
  let editHighlight = $state(false);

  function openEdit(link: Link) {
    editingLink = link;
    editTitle = link.title;
    editUrl = link.url;
    editSubtitle = link.subtitle ?? '';
    editStartAt = link.start_at ?? '';
    editEndAt = link.end_at ?? '';
    editHighlight = link.highlight;
  }

  // Section title inline edit
  let editingSectionId = $state<string | null>(null);
  let sectionTitleValue = $state('');

  function startEditTitle(section: LinkSection) {
    editingSectionId = section.id;
    sectionTitleValue = section.title ?? '';
  }

  function saveTitle(sectionId: string) {
    const fd = new FormData();
    fd.set('sectionId', sectionId);
    fd.set('title', sectionTitleValue);
    fetch('/app?/updateSection', { method: 'POST', body: fd }).then(() => {
      editingSectionId = null;
      invalidateAll();
      studio.showToast('Title updated');
    });
  }

  function enhanceAction(successMsg: string) {
    return () => {
      return async ({ result }: { result: { type: string } }) => {
        if (result.type === 'success') {
          invalidateAll();
          studio.showToast(successMsg);
        } else if (result.type === 'failure') {
          studio.showToast('Action failed', 'error');
        }
      };
    };
  }

  // Drag & drop for links (scoped to the expanded section)
  let dragIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let dragSectionId = $state<string | null>(null);

  function handleDragStart(e: DragEvent, index: number, sectionId: string) {
    dragIndex = index;
    dragSectionId = sectionId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dragOverIndex = index;
  }

  function handleDragLeave() {
    dragOverIndex = null;
  }

  function handleDrop(e: DragEvent, dropIndex: number, sectionId: string) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex || dragSectionId !== sectionId) {
      dragIndex = null;
      dragOverIndex = null;
      dragSectionId = null;
      return;
    }
    const secLinks = linksForSection(sectionId);
    const reordered = [...secLinks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    dragIndex = null;
    dragOverIndex = null;
    dragSectionId = null;
    const order = reordered.map((l) => l.id);
    const fd = new FormData();
    fd.set('order', JSON.stringify(order));
    fetch('/app?/reorder', { method: 'POST', body: fd }).then(() => {
      invalidateAll();
      studio.showToast('Links reordered');
    });
  }

  function handleDragEnd() {
    dragIndex = null;
    dragOverIndex = null;
    dragSectionId = null;
  }

  // Drag & drop for sections
  let secDragIndex = $state<number | null>(null);
  let secDragOverIndex = $state<number | null>(null);

  function handleSecDragStart(e: DragEvent, index: number) {
    secDragIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  function handleSecDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    secDragOverIndex = index;
  }

  function handleSecDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    if (secDragIndex === null || secDragIndex === dropIndex) {
      secDragIndex = null;
      secDragOverIndex = null;
      return;
    }
    const reordered = [...sections];
    const [moved] = reordered.splice(secDragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    secDragIndex = null;
    secDragOverIndex = null;
    const order = reordered.map((s) => s.id);
    const fd = new FormData();
    fd.set('order', JSON.stringify(order));
    fetch('/app?/reorderSections', { method: 'POST', body: fd }).then(() => {
      invalidateAll();
      studio.showToast('Sections reordered');
    });
  }

  function handleSecDragEnd() {
    secDragIndex = null;
    secDragOverIndex = null;
  }
</script>

<PanelShell title="Links">
  <!-- Usage bar (free users) -->
  {#if !isPro}
    <div class="mb-4">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[11px] font-medium text-gray-500">
          {totalLinkCount} of {FREE_LINK_LIMIT} links used
        </span>
        <span class="text-[10px] font-semibold tabular-nums
          {linkUsagePercent >= 90 ? 'text-amber-600' : 'text-gray-400'}">
          {linkUsagePercent}%
        </span>
      </div>
      <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out
            {linkUsagePercent >= 90
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-indigo-400 to-indigo-500'}"
          style="width: {linkUsagePercent}%"
        ></div>
      </div>
    </div>
  {/if}

  {#if !canAddLink}
    <div class="mb-4">
      <UpgradeCTA message="You've reached the free limit of {FREE_LINK_LIMIT} links." />
    </div>
  {/if}

  <!-- Section blocks -->
  <div class="space-y-2.5 pb-5">
    {#each sections as section, si (section.id)}
      {@const secLinks = linksForSection(section.id)}
      {@const isExpanded = expandedId === section.id}

      <div
        class="section-card rounded-2xl transition-all duration-200 overflow-hidden
          {secDragIndex === si ? 'opacity-30 scale-[0.97]' : ''}
          {secDragOverIndex === si && secDragIndex !== si
            ? 'ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-100/50'
            : ''}
          {isExpanded
            ? 'shadow-md shadow-gray-200/80 ring-1 ring-gray-200/60'
            : 'shadow-sm shadow-gray-100/60 hover:shadow-md hover:shadow-gray-200/60 ring-1 ring-gray-100'}"
      >
        <!-- Section header -->
        <div
          role="listitem"
          draggable="true"
          ondragstart={(e) => handleSecDragStart(e, si)}
          ondragover={(e) => handleSecDragOver(e, si)}
          ondragleave={() => { secDragOverIndex = null; }}
          ondrop={(e) => handleSecDrop(e, si)}
          ondragend={handleSecDragEnd}
          class="flex items-center gap-2.5 px-3 py-3 transition-colors
            {isExpanded ? 'bg-gradient-to-r from-gray-50/90 to-white' : 'bg-white'}"
        >
          <!-- Drag handle (6-dot grid) -->
          <div class="cursor-grab active:cursor-grabbing text-gray-300
            hover:text-gray-400 touch-none shrink-0 transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.2" />
              <circle cx="11" cy="3" r="1.2" />
              <circle cx="5" cy="8" r="1.2" />
              <circle cx="11" cy="8" r="1.2" />
              <circle cx="5" cy="13" r="1.2" />
              <circle cx="11" cy="13" r="1.2" />
            </svg>
          </div>

          <!-- Title + meta (clickable to expand) -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="flex-1 min-w-0 cursor-pointer select-none"
            onclick={() => { expandedId = isExpanded ? null : section.id; }}
          >
            {#if editingSectionId === section.id}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="flex gap-1.5 items-center" onclick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  bind:value={sectionTitleValue}
                  placeholder="Section title"
                  class="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900
                    focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300
                    shadow-sm transition-shadow"
                  onkeydown={(e) => { if (e.key === 'Enter') saveTitle(section.id); }}
                />
                <button
                  onclick={() => saveTitle(section.id)}
                  class="text-[11px] bg-indigo-600 text-white font-medium px-2.5 py-1
                    rounded-md hover:bg-indigo-700 transition-colors"
                >Save</button>
                <button
                  onclick={() => { editingSectionId = null; }}
                  class="text-[11px] text-gray-400 hover:text-gray-600 px-1.5 py-1
                    transition-colors"
                >Cancel</button>
              </div>
            {:else}
              <p class="text-[13px] font-semibold text-gray-800 truncate leading-tight">
                {section.title || 'Untitled section'}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {secLinks.length}
                </span>
                <span class="text-[10px] font-medium bg-gray-100 text-gray-500
                  px-2 py-0.5 rounded-md">
                  {LAYOUT_OPTIONS.find((o) => o.value === section.layout)?.label ?? section.layout}
                </span>
                {#if !section.is_visible}
                  <span class="inline-flex items-center gap-0.5 text-[10px] font-medium
                    bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">
                    <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                    Hidden
                  </span>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Visibility toggle -->
          <button
            onclick={() => {
              const fd = new FormData();
              fd.set('sectionId', section.id);
              fd.set('isVisible', String(!section.is_visible));
              fetch('/app?/updateSection', { method: 'POST', body: fd }).then(() =>
                invalidateAll(),
              );
            }}
            class="p-1.5 rounded-lg transition-colors shrink-0
              {section.is_visible
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}"
            aria-label={section.is_visible ? 'Hide section' : 'Show section'}
          >
            {#if section.is_visible}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            {:else}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            {/if}
          </button>

          <!-- Expand chevron -->
          <button
            onclick={() => { expandedId = isExpanded ? null : section.id; }}
            class="p-1.5 rounded-lg hover:bg-gray-100 shrink-0 transition-colors"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            <svg
              class="w-4 h-4 text-gray-400 transition-transform duration-200
                {isExpanded ? 'rotate-90' : ''}"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Expanded content -->
        {#if isExpanded}
          <div class="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
            <!-- Section actions row -->
            <div class="flex items-center gap-1.5 px-3 pt-3 pb-2">
              <button
                onclick={() => startEditTitle(section)}
                class="inline-flex items-center gap-1 text-[11px] font-medium
                  text-gray-500 hover:text-indigo-600 bg-white hover:bg-indigo-50
                  px-2.5 py-1 rounded-lg border border-gray-150 hover:border-indigo-200
                  shadow-sm transition-all"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Rename
              </button>
              {#if sections.length > 1}
                <button
                  onclick={() => {
                    if (!confirm('Delete this component and all its links?')) return;
                    const fd = new FormData();
                    fd.set('sectionId', section.id);
                    fetch('/app?/deleteSection', { method: 'POST', body: fd }).then(() => {
                      expandedId = null;
                      invalidateAll();
                      studio.showToast('Component deleted');
                    });
                  }}
                  class="inline-flex items-center gap-1 text-[11px] font-medium
                    text-gray-500 hover:text-red-600 bg-white hover:bg-red-50
                    px-2.5 py-1 rounded-lg border border-gray-150 hover:border-red-200
                    shadow-sm transition-all"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete
                </button>
              {/if}
            </div>

            <!-- Layout selector -->
            <div class="px-3 pb-3">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Layout
              </p>
              <div class="grid grid-cols-4 gap-1.5">
                {#each LAYOUT_OPTIONS as opt}
                  {@const selected = section.layout === opt.value}
                  {@const locked = opt.pro && !isPro}
                  <form
                    method="POST"
                    action="?/updateSectionLayout"
                    use:enhance={enhanceAction('Layout updated')}
                  >
                    <input type="hidden" name="sectionId" value={section.id} />
                    <input type="hidden" name="layout" value={opt.value} />
                    <button
                      type={locked ? 'button' : 'submit'}
                      onclick={locked ? () => goto('/app/billing') : undefined}
                      class="w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl
                        border transition-all duration-150
                        {selected
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
                          : 'border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50'}
                        {locked ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}"
                    >
                      <!-- Mini layout preview icon -->
                      <div class="w-6 h-5 flex items-center justify-center
                        {selected ? 'text-indigo-600' : 'text-gray-400'}">
                        {#if opt.icon === 'list'}
                          <svg viewBox="0 0 20 16" class="w-5 h-4" fill="currentColor">
                            <rect x="0" y="1" width="20" height="3" rx="1" opacity="0.8" />
                            <rect x="0" y="6.5" width="20" height="3" rx="1" opacity="0.5" />
                            <rect x="0" y="12" width="20" height="3" rx="1" opacity="0.3" />
                          </svg>
                        {:else if opt.icon === 'grid'}
                          <svg viewBox="0 0 20 16" class="w-5 h-4" fill="currentColor">
                            <rect x="0" y="0" width="9" height="7" rx="1.5" opacity="0.7" />
                            <rect x="11" y="0" width="9" height="7" rx="1.5" opacity="0.5" />
                            <rect x="0" y="9" width="9" height="7" rx="1.5" opacity="0.4" />
                            <rect x="11" y="9" width="9" height="7" rx="1.5" opacity="0.3" />
                          </svg>
                        {:else if opt.icon === 'grid-img'}
                          <svg viewBox="0 0 20 16" class="w-5 h-4" fill="currentColor">
                            <rect x="0" y="0" width="9" height="7" rx="1.5" opacity="0.7" />
                            <rect x="11" y="0" width="9" height="7" rx="1.5" opacity="0.5" />
                            <rect x="0" y="9" width="9" height="7" rx="1.5" opacity="0.4" />
                            <rect x="11" y="9" width="9" height="7" rx="1.5" opacity="0.3" />
                            <circle cx="4" cy="3" r="1.5" fill="white" opacity="0.8" />
                            <circle cx="15" cy="3" r="1.5" fill="white" opacity="0.6" />
                          </svg>
                        {:else}
                          <svg viewBox="0 0 20 16" class="w-5 h-4" fill="currentColor">
                            <rect x="0" y="1" width="20" height="3" rx="1" opacity="0.8" />
                            <rect x="0" y="6.5" width="20" height="3" rx="1" opacity="0.5" />
                            <rect x="0" y="12" width="20" height="3" rx="1" opacity="0.3" />
                            <circle cx="2.5" cy="2.5" r="1.5" fill="white" opacity="0.8" />
                            <circle cx="2.5" cy="8" r="1.5" fill="white" opacity="0.6" />
                          </svg>
                        {/if}
                      </div>
                      <span class="text-[9px] font-semibold leading-none
                        {selected ? 'text-indigo-700' : 'text-gray-500'}">
                        {opt.label}
                      </span>
                      {#if opt.pro && !isPro}
                        <span class="text-[7px] font-bold uppercase tracking-wider
                          text-amber-600 leading-none -mt-0.5">PRO</span>
                      {/if}
                    </button>
                  </form>
                {/each}
              </div>
            </div>

            <!-- Divider -->
            <div class="mx-3 border-t border-gray-100"></div>

            <!-- Links in this section -->
            <div class="px-3 pt-3 pb-2 space-y-1.5">
              {#each secLinks as link, i (link.id)}
                <LinkCard
                  {link}
                  editable
                  dragging={dragSectionId === section.id && dragIndex === i}
                  dragOver={dragSectionId === section.id && dragOverIndex === i}
                  ondragstart={(e) => handleDragStart(e, i, section.id)}
                  ondragover={(e) => handleDragOver(e, i)}
                  ondragleave={handleDragLeave}
                  ondrop={(e) => handleDrop(e, i, section.id)}
                  ondragend={handleDragEnd}
                  onEdit={() => openEdit(link)}
                  onToggle={() => {
                    const fd = new FormData();
                    fd.set('linkId', link.id);
                    fd.set('isActive', String(link.is_active));
                    fetch('/app?/toggleLink', { method: 'POST', body: fd }).then(() =>
                      invalidateAll(),
                    );
                  }}
                  onDelete={() => {
                    if (!confirm('Delete this link?')) return;
                    const fd = new FormData();
                    fd.set('linkId', link.id);
                    fetch('/app?/deleteLink', { method: 'POST', body: fd }).then(() => {
                      invalidateAll();
                      studio.showToast('Link deleted');
                    });
                  }}
                  onDuplicate={() => {
                    const fd = new FormData();
                    fd.set('linkId', link.id);
                    fetch('/app?/duplicateLink', { method: 'POST', body: fd }).then(() => {
                      invalidateAll();
                      studio.showToast('Link duplicated');
                    });
                  }}
                />
              {:else}
                <div class="flex flex-col items-center py-6 text-center">
                  <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                    <svg class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <p class="text-xs text-gray-400">No links yet</p>
                  <p class="text-[10px] text-gray-300 mt-0.5">Add your first link below</p>
                </div>
              {/each}
            </div>

            <!-- Add link to this section -->
            <div class="px-3 pb-3">
              <button
                onclick={() => openAddModal(section.id)}
                disabled={!canAddLink}
                class="add-link-btn w-full flex items-center justify-center gap-1.5
                  text-xs font-semibold py-2.5 rounded-xl transition-all duration-200
                  disabled:opacity-30 disabled:pointer-events-none
                  text-indigo-600 hover:text-indigo-700
                  bg-indigo-50/60 hover:bg-indigo-50
                  border border-indigo-100 hover:border-indigo-200
                  hover:shadow-sm active:scale-[0.98]"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add link
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex flex-col items-center py-10 text-center">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100
          flex items-center justify-center mb-3 shadow-sm">
          <svg class="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.43 9.75m11.14 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 mb-1">No components yet</p>
        <p class="text-xs text-gray-400">Create your first link component below</p>
      </div>
    {/each}
  </div>

  <!-- Add new component button -->
  <form
    method="POST"
    action="?/addSection"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          invalidateAll();
          studio.showToast('Component added');
        } else if (result.type === 'failure') {
          studio.showToast('Failed to add component', 'error');
        }
      };
    }}
  >
    <input type="hidden" name="title" value="" />
    <button
      type="submit"
      class="add-component-btn group w-full flex items-center justify-center gap-2.5
        py-3.5 px-4 rounded-2xl text-sm font-semibold
        text-gray-400 hover:text-indigo-600
        bg-white hover:bg-indigo-50/50
        border-2 border-dashed border-gray-200 hover:border-indigo-300
        shadow-sm hover:shadow-md hover:shadow-indigo-50
        transition-all duration-200 active:scale-[0.98]"
    >
      <div class="w-7 h-7 rounded-xl bg-gray-100 group-hover:bg-indigo-100
        flex items-center justify-center transition-colors duration-200">
        <svg class="w-4 h-4 text-gray-400 group-hover:text-indigo-600
          transition-transform duration-200 group-hover:rotate-90"
          fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      Add component
    </button>
  </form>
</PanelShell>

<!-- Add Link Modal -->
<Modal open={addToSectionId !== null} onclose={resetAddForm} title="Add link">
  <form
    method="POST"
    action="?/addLink"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          resetAddForm();
          invalidateAll();
          studio.showToast('Link added');
        }
      };
    }}
  >
    {#if addToSectionId}
      <input type="hidden" name="sectionId" value={addToSectionId} />
    {/if}
    <div class="space-y-4">
      <Input
        name="title"
        label="Title"
        placeholder="My Website"
        bind:value={newTitle}
        required
      />
      <Input
        name="url"
        label="URL"
        type="url"
        placeholder="https://example.com"
        bind:value={newUrl}
        required
      />
      <Input
        name="subtitle"
        label="Subtitle (optional)"
        placeholder="Check out my site"
        bind:value={newSubtitle}
      />
      <Button type="submit" variant="primary" class="w-full">Add link</Button>
    </div>
  </form>
</Modal>

<!-- Edit Link Modal -->
<Modal
  open={editingLink !== null}
  onclose={() => { editingLink = null; }}
  title="Edit link"
>
  {#if editingLink}
    <form
      method="POST"
      action="?/updateLink"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            editingLink = null;
            invalidateAll();
            studio.showToast('Link updated');
          }
        };
      }}
    >
      <input type="hidden" name="linkId" value={editingLink.id} />
      <div class="space-y-4">
        <Input name="title" label="Title" bind:value={editTitle} required />
        <Input name="url" label="URL" type="url" bind:value={editUrl} required />
        <Input name="subtitle" label="Subtitle" bind:value={editSubtitle} />

        {#if isPro}
          <Input name="startAt" label="Start at" type="datetime-local" bind:value={editStartAt} />
          <Input name="endAt" label="End at" type="datetime-local" bind:value={editEndAt} />
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="highlight"
              bind:checked={editHighlight}
              class="w-4 h-4 rounded border-gray-300 text-indigo-600"
            />
            Highlight this link
          </label>
        {:else}
          <p class="text-xs text-gray-400">
            Scheduling and highlights are Pro features.
            <a href="/app/billing" class="text-indigo-600 underline">Upgrade</a>
          </p>
        {/if}

        <Button type="submit" variant="primary" class="w-full">
          Save changes
        </Button>
      </div>
    </form>
  {/if}
</Modal>

<style>
  /* Section card subtle entrance */
  .section-card {
    animation: section-enter 0.2s ease-out;
  }

  @keyframes section-enter {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Add component hover glow */
  .add-component-btn:hover {
    background-image: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.04) 0%, transparent 70%);
  }

  /* Add link button subtle pulse on hover */
  .add-link-btn:hover {
    background-image: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
  }
</style>
