<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Tabs from '$lib/components/ui/Tabs.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import LinkCard from '$lib/components/ui/LinkCard.svelte';
  import PhonePreview from '$lib/components/ui/PhonePreview.svelte';
  import { resolveThemeConfig } from '$lib/themes.js';
  import { isLinkVisible } from '$lib/utils/helpers.js';
  import { FREE_LINK_LIMIT } from '$lib/types.js';
  import type { Link, ThemeConfig } from '$lib/types.js';

  let { data } = $props();

  let mobileTab = $state('editor');
  let showAddModal = $state(false);
  let editingLink = $state<Link | null>(null);
  let toast = $state({ message: '', type: 'info' as const, visible: false });

  // New link form
  let newTitle = $state('');
  let newUrl = $state('');
  let newSubtitle = $state('');

  // Edit link form
  let editTitle = $state('');
  let editUrl = $state('');
  let editSubtitle = $state('');
  let editStartAt = $state('');
  let editEndAt = $state('');
  let editHighlight = $state(false);

  const profile = $derived(data.profile);
  const links = $derived(data.links ?? []);
  const isPro = $derived(profile?.plan === 'PRO');
  const linkCount = $derived(links.length);
  const canAddLink = $derived(isPro || linkCount < FREE_LINK_LIMIT);

  const currentTheme = $derived(
    data.themes?.find((t: { id: string }) => t.id === profile?.theme_id)
  );
  const themeConfig = $derived(
    currentTheme
      ? resolveThemeConfig(
          currentTheme.config as ThemeConfig,
          (profile?.theme_overrides ?? {}) as Partial<ThemeConfig>
        )
      : null
  );

  const visibleLinks = $derived(
    links.filter((l: Link) => isLinkVisible(l))
  );

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    toast = { message, type, visible: true };
    setTimeout(() => { toast.visible = false; }, 3000);
  }

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
</script>

<svelte:head>
  <title>Editor — Lnksy</title>
</svelte:head>

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

<!-- Mobile tabs -->
<div class="md:hidden mb-4">
  <Tabs
    tabs={[
      { id: 'editor', label: 'Editor' },
      { id: 'preview', label: 'Preview' },
    ]}
    active={mobileTab}
    onchange={(id) => { mobileTab = id; }}
  />
</div>

<div class="flex gap-6">
  <!-- Editor panel -->
  <div class="flex-1 {mobileTab === 'preview' ? 'hidden md:block' : ''}">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-semibold text-gray-900">Links</h1>
      <div class="flex items-center gap-2">
        {#if !isPro}
          <span class="text-xs text-gray-400">
            {linkCount}/{FREE_LINK_LIMIT}
          </span>
        {/if}
        <Button
          size="sm"
          onclick={() => { showAddModal = true; }}
          disabled={!canAddLink}
        >
          Add link
        </Button>
      </div>
    </div>

    {#if !canAddLink}
      <Card class="mb-4 bg-amber-50 border-amber-200">
        <p class="text-sm text-amber-800">
          You've reached the free plan limit of {FREE_LINK_LIMIT} links.
          <a href="/app/billing" class="font-medium underline">
            Upgrade to Pro
          </a>
          for unlimited links.
        </p>
      </Card>
    {/if}

    <!-- Links list -->
    <div class="space-y-2">
      {#each links as link (link.id)}
        <LinkCard
          {link}
          editable
          onEdit={() => openEdit(link)}
          onToggle={() => {
            const fd = new FormData();
            fd.set('linkId', link.id);
            fd.set('isActive', String(link.is_active));
            fetch('/app?/toggleLink', { method: 'POST', body: fd })
              .then(() => invalidateAll());
          }}
          onDelete={() => {
            if (!confirm('Delete this link?')) return;
            const fd = new FormData();
            fd.set('linkId', link.id);
            fetch('/app?/deleteLink', { method: 'POST', body: fd })
              .then(() => {
                invalidateAll();
                showToast('Link deleted');
              });
          }}
          onDuplicate={() => {
            const fd = new FormData();
            fd.set('linkId', link.id);
            fetch('/app?/duplicateLink', { method: 'POST', body: fd })
              .then(() => {
                invalidateAll();
                showToast('Link duplicated');
              });
          }}
        />
      {:else}
        <Card>
          <p class="text-center text-gray-500 text-sm py-8">
            No links yet. Add your first link!
          </p>
        </Card>
      {/each}
    </div>
  </div>

  <!-- Preview panel (desktop always, mobile via tab) -->
  <div class="hidden md:block w-[420px] shrink-0 sticky top-6 self-start
    {mobileTab === 'preview' ? '!block' : ''}">
    {#if themeConfig && profile}
      <PhonePreview>
        <div
          class="min-h-full p-6 pt-12 flex flex-col items-center"
          style="background: {themeConfig.bg}; color: {themeConfig.text};
            font-family: {themeConfig.font};"
        >
          {#if profile.avatar_url}
            <img
              src={profile.avatar_url}
              alt={profile.name ?? profile.handle}
              class="w-20 h-20 rounded-full object-cover mb-4"
            />
          {:else}
            <div class="w-20 h-20 rounded-full bg-gray-300 mb-4
              flex items-center justify-center text-2xl font-bold
              text-white">
              {(profile.name ?? profile.handle)?.[0]?.toUpperCase()}
            </div>
          {/if}

          <h2 class="text-lg font-bold">
            {profile.name ?? profile.handle}
          </h2>
          {#if profile.bio}
            <p class="text-sm opacity-70 mt-1 text-center">
              {profile.bio}
            </p>
          {/if}

          <div class="w-full mt-6 space-y-3">
            {#each visibleLinks as link (link.id)}
              <LinkCard {link} {themeConfig} />
            {/each}
          </div>

          {#if profile.branding_enabled}
            <p class="mt-auto pt-8 text-xs opacity-40">
              Made with Lnksy
            </p>
          {/if}
        </div>
      </PhonePreview>
    {/if}
  </div>
</div>

<!-- Add Link Modal -->
<Modal
  open={showAddModal}
  onclose={resetAddForm}
  title="Add link"
>
  <form
    method="POST"
    action="?/addLink"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          resetAddForm();
          invalidateAll();
          showToast('Link added');
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
      <Button type="submit" variant="primary" class="w-full">
        Add link
      </Button>
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
            showToast('Link updated');
          }
        };
      }}
    >
      <input type="hidden" name="linkId" value={editingLink.id} />
      <div class="space-y-4">
        <Input
          name="title"
          label="Title"
          bind:value={editTitle}
          required
        />
        <Input
          name="url"
          label="URL"
          type="url"
          bind:value={editUrl}
          required
        />
        <Input
          name="subtitle"
          label="Subtitle"
          bind:value={editSubtitle}
        />

        {#if isPro}
          <Input
            name="startAt"
            label="Start at"
            type="datetime-local"
            bind:value={editStartAt}
          />
          <Input
            name="endAt"
            label="End at"
            type="datetime-local"
            bind:value={editEndAt}
          />
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
            <a href="/app/billing"
              class="text-indigo-600 underline">Upgrade</a>
          </p>
        {/if}

        <Button type="submit" variant="primary" class="w-full">
          Save changes
        </Button>
      </div>
    </form>
  {/if}
</Modal>
