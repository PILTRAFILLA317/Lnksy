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
    pro: boolean;
  }[] = [
    { value: 'LIST_ICON', label: 'List', pro: false },
    { value: 'GRID_ICON', label: 'Grid', pro: false },
    { value: 'GRID_IMAGE', label: 'Grid + Image', pro: true },
    { value: 'LIST_IMAGE', label: 'List + Image', pro: true },
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
  <!-- Link count -->
  {#if !isPro}
    <p class="text-xs text-gray-400 mb-3">{totalLinkCount}/{FREE_LINK_LIMIT} links</p>
  {/if}

  {#if !canAddLink}
    <div class="mb-3">
      <UpgradeCTA message="You've reached the free limit of {FREE_LINK_LIMIT} links." />
    </div>
  {/if}

  <!-- Section blocks -->
  <div class="space-y-3 pb-4">
    {#each sections as section, si (section.id)}
      {@const secLinks = linksForSection(section.id)}
      {@const isExpanded = expandedId === section.id}

      <div
        class="rounded-xl border transition-colors overflow-hidden
          {secDragIndex === si ? 'opacity-40' : ''}
          {secDragOverIndex === si ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-200'}
          {isExpanded ? 'ring-2 ring-indigo-100' : ''}"
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
          class="flex items-center gap-2 px-3 py-2.5 bg-gray-50/80"
        >
          <!-- Drag handle -->
          <div class="cursor-grab active:cursor-grabbing text-gray-300
            hover:text-gray-500 touch-none shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 8h16M4 16h16" />
            </svg>
          </div>

          <!-- Title + meta (clickable to expand) -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="flex-1 min-w-0 cursor-pointer"
            onclick={() => { expandedId = isExpanded ? null : section.id; }}
          >
            {#if editingSectionId === section.id}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="flex gap-1.5" onclick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  bind:value={sectionTitleValue}
                  placeholder="Section title"
                  class="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1
                    focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  onkeydown={(e) => { if (e.key === 'Enter') saveTitle(section.id); }}
                />
                <button
                  onclick={() => saveTitle(section.id)}
                  class="text-[10px] text-indigo-600 font-semibold px-1.5"
                >OK</button>
                <button
                  onclick={() => { editingSectionId = null; }}
                  class="text-[10px] text-gray-400 px-1"
                >X</button>
              </div>
            {:else}
              <p class="text-xs font-semibold text-gray-800 truncate">
                {section.title || 'Untitled'}
              </p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[10px] text-gray-400">{secLinks.length} links</span>
                <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {LAYOUT_OPTIONS.find((o) => o.value === section.layout)?.label ?? section.layout}
                </span>
                {#if !section.is_visible}
                  <span class="text-[10px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">
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
            class="p-1 rounded hover:bg-gray-200/60 shrink-0"
            aria-label={section.is_visible ? 'Hide' : 'Show'}
          >
            {#if section.is_visible}
              <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0
                     8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542
                     7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {:else}
              <svg class="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478
                     0-8.268-2.943-9.543-7a9.97 9.97 0
                     011.563-3.029m5.858.908a3 3 0 114.243
                     4.243M9.878 9.878l4.242 4.242M9.88
                     9.88l-3.29-3.29m7.532 7.532l3.29
                     3.29M3 3l3.59 3.59m0 0A9.953 9.953 0
                     0112 5c4.478 0 8.268 2.943 9.543
                     7a10.025 10.025 0 01-4.132
                     5.411m0 0L21 21" />
              </svg>
            {/if}
          </button>

          <!-- Expand chevron -->
          <button
            onclick={() => { expandedId = isExpanded ? null : section.id; }}
            class="p-1 rounded hover:bg-gray-200/60 shrink-0"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              class="w-3.5 h-3.5 text-gray-400 transition-transform
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
          <div class="px-3 py-3 border-t border-gray-100 space-y-3">
            <!-- Section actions row -->
            <div class="flex items-center gap-2">
              <button
                onclick={() => startEditTitle(section)}
                class="text-[10px] text-indigo-600 hover:text-indigo-800
                  font-medium underline decoration-dashed underline-offset-2"
              >
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
                  class="text-[10px] text-red-500 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              {/if}
            </div>

            <!-- Layout selector (compact) -->
            <div class="flex gap-1.5 flex-wrap">
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
                    class="text-[10px] font-medium px-2.5 py-1 rounded-lg border
                      transition-all
                      {selected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'}
                      {locked ? 'opacity-40' : ''}"
                  >
                    {opt.label}
                    {#if opt.pro}
                      <span class="text-[8px] ml-0.5 opacity-60">PRO</span>
                    {/if}
                  </button>
                </form>
              {/each}
            </div>

            <!-- Links in this section -->
            <div class="space-y-1.5">
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
                <p class="text-xs text-gray-400 text-center py-3">No links yet</p>
              {/each}
            </div>

            <!-- Add link to this section -->
            <button
              onclick={() => openAddModal(section.id)}
              disabled={!canAddLink}
              class="w-full text-xs font-medium text-indigo-600 hover:text-indigo-800
                border border-dashed border-indigo-200 hover:border-indigo-400
                rounded-lg py-2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              + Add link
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-sm text-gray-400 text-center py-6">No link components yet.</p>
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
      class="w-full flex items-center justify-center gap-2 py-3 px-4
        rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400
        text-sm font-medium text-gray-500 hover:text-indigo-600
        transition-colors bg-gray-50/50 hover:bg-indigo-50/30"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
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
