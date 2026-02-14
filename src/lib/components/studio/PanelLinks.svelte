<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import LinkCard from '$lib/components/ui/LinkCard.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { FREE_LINK_LIMIT } from '$lib/types.js';
  import type { Link } from '$lib/types.js';

  interface Props {
    links: Link[];
    isPro: boolean;
  }

  let { links, isPro }: Props = $props();

  const linkCount = $derived(links.length);
  const canAddLink = $derived(isPro || linkCount < FREE_LINK_LIMIT);

  let showAddModal = $state(false);
  let editingLink = $state<Link | null>(null);

  // Add form
  let newTitle = $state('');
  let newUrl = $state('');
  let newSubtitle = $state('');

  // Edit form
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

  function resetAddForm() {
    newTitle = '';
    newUrl = '';
    newSubtitle = '';
    showAddModal = false;
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

  // Drag & drop
  let dragIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  function handleDragStart(e: DragEvent, index: number) {
    dragIndex = index;
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

  function handleDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndex = null;
      dragOverIndex = null;
      return;
    }
    const reordered = [...links];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    dragIndex = null;
    dragOverIndex = null;
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
  }
</script>

<PanelShell title="Links">
  <!-- Header with count + add button -->
  <div class="flex items-center justify-between mb-3">
    {#if !isPro}
      <span class="text-xs text-gray-400">
        {linkCount}/{FREE_LINK_LIMIT}
      </span>
    {:else}
      <span class="text-xs text-gray-400">{linkCount} links</span>
    {/if}
    <Button
      size="sm"
      onclick={() => { showAddModal = true; }}
      disabled={!canAddLink}
    >
      Add link
    </Button>
  </div>

  {#if !canAddLink}
    <div class="mb-3">
      <UpgradeCTA message="You've reached the free limit of {FREE_LINK_LIMIT} links." />
    </div>
  {/if}

  <!-- Links list -->
  <div class="space-y-2 pb-6">
    {#each links as link, i (link.id)}
      <LinkCard
        {link}
        editable
        dragging={dragIndex === i}
        dragOver={dragOverIndex === i}
        ondragstart={(e) => handleDragStart(e, i)}
        ondragover={(e) => handleDragOver(e, i)}
        ondragleave={handleDragLeave}
        ondrop={(e) => handleDrop(e, i)}
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
          fetch('/app?/duplicateLink', { method: 'POST', body: fd }).then(
            () => {
              invalidateAll();
              studio.showToast('Link duplicated');
            },
          );
        }}
      />
    {:else}
      <div class="text-center py-8">
        <p class="text-sm text-gray-500 mb-3">No links yet.</p>
        <Button size="sm" onclick={() => { showAddModal = true; }}>
          Add your first link
        </Button>
      </div>
    {/each}
  </div>
</PanelShell>

<!-- Add Link Modal -->
<Modal open={showAddModal} onclose={resetAddForm} title="Add link">
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
