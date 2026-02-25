<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { ProfileContact, ContactType } from '$lib/types.js';
  import { CONTACT_ICON_LIST, getContactIconSvg } from '$lib/utils/contact-icons.js';

  interface Props {
    contacts: ProfileContact[];
    plan?: 'FREE' | 'PRO';
  }

  let { contacts, plan = 'FREE' }: Props = $props();

  // ── Derived ────────────────────────────────────────────────
  const sorted = $derived(
    [...contacts].sort((a, b) => a.order_index - b.order_index),
  );

  const existingPredefinedTypes = $derived(
    new Set(contacts.filter((c) => c.type !== 'custom_link').map((c) => c.type)),
  );

  // ── Local state ────────────────────────────────────────────
  let expandedId = $state<string | null>(null);
  let showAddMenu = $state(false);
  let addingPredefined = $state<ContactType | null>(null);
  let showCustomForm = $state(false);

  // Edit value for predefined types
  let editValues = $state<Record<string, string>>({});
  $effect(() => {
    const vals: Record<string, string> = {};
    for (const c of contacts) vals[c.id] = c.value;
    editValues = vals;
  });

  // Add predefined form value
  let addValue = $state('');

  // Custom link form (shared for add + edit)
  let customUrl = $state('');
  let customIcon = $state('globe');
  let customLabel = $state('');
  let customEditId = $state<string | null>(null);

  let errorMsg = $state('');

  // ── Predefined type metadata ───────────────────────────────
  const PREDEFINED: { type: ContactType; label: string; placeholder: string }[] = [
    { type: 'whatsapp', label: 'WhatsApp', placeholder: '+1234567890' },
    { type: 'telegram', label: 'Telegram', placeholder: '@username' },
    { type: 'phone', label: 'Phone', placeholder: '+1234567890' },
    { type: 'email', label: 'Email', placeholder: 'you@example.com' },
  ];

  function predefinedLabel(type: ContactType): string {
    return PREDEFINED.find((p) => p.type === type)?.label ?? type;
  }

  function predefinedPlaceholder(type: ContactType): string {
    return PREDEFINED.find((p) => p.type === type)?.placeholder ?? '';
  }

  // ── Helpers ────────────────────────────────────────────────
  function callAction(path: string, data: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.set(k, v);
    return fetch(`/app?/${path}`, { method: 'POST', body: fd });
  }

  async function doToggle(contact: ProfileContact) {
    const newEnabled = !contact.is_enabled;
    await callAction('toggleContact', {
      contactId: contact.id,
      isEnabled: String(newEnabled),
    });
    invalidateAll();
    studio.showToast(`${contact.type === 'custom_link' ? contact.label || 'Link' : predefinedLabel(contact.type)} ${newEnabled ? 'enabled' : 'disabled'}`);
  }

  async function doDelete(contact: ProfileContact) {
    if (!confirm('Delete this contact?')) return;
    await callAction('deleteContact', { contactId: contact.id });
    invalidateAll();
    studio.showToast('Contact deleted');
    if (expandedId === contact.id) expandedId = null;
    if (customEditId === contact.id) customEditId = null;
  }

  async function doMoveUp(contact: ProfileContact) {
    await callAction('moveContactUp', { contactId: contact.id });
    invalidateAll();
  }

  async function doMoveDown(contact: ProfileContact) {
    await callAction('moveContactDown', { contactId: contact.id });
    invalidateAll();
  }

  function openEdit(contact: ProfileContact) {
    errorMsg = '';
    if (expandedId === contact.id) {
      expandedId = null;
      customEditId = null;
      return;
    }
    expandedId = contact.id;
    if (contact.type === 'custom_link') {
      customEditId = contact.id;
      customUrl = contact.url ?? contact.value ?? '';
      customIcon = contact.icon ?? 'globe';
      customLabel = contact.label ?? '';
    }
  }

  function openAddMenu() {
    showAddMenu = !showAddMenu;
    showCustomForm = false;
    addingPredefined = null;
    addValue = '';
    errorMsg = '';
  }

  function selectAddType(type: ContactType | 'custom_link') {
    showAddMenu = false;
    errorMsg = '';
    if (type === 'custom_link') {
      customEditId = null;
      customUrl = '';
      customIcon = 'globe';
      customLabel = '';
      showCustomForm = true;
    } else {
      addingPredefined = type;
      addValue = '';
    }
  }

  // ── Inline SVG for predefined icons ───────────────────────
</script>

<PanelShell title="Contact Buttons">
  <p class="text-xs text-gray-500 mb-4">
    Add contact methods that appear as icon buttons on your page.
  </p>

  <!-- ── Contact list ──────────────────────────────────────── -->
  {#if sorted.length > 0}
    <ul class="space-y-2 mb-4" role="list">
      {#each sorted as contact, i (contact.id)}
        <li class="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <!-- Row -->
          <div class="flex items-center gap-2 px-3 py-2.5">
            <!-- Reorder -->
            <div class="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onclick={() => doMoveUp(contact)}
                disabled={i === 0}
                aria-label="Move up"
                class="text-gray-300 hover:text-gray-600 disabled:opacity-20
                  disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </button>
              <button
                type="button"
                onclick={() => doMoveDown(contact)}
                disabled={i === sorted.length - 1}
                aria-label="Move down"
                class="text-gray-300 hover:text-gray-600 disabled:opacity-20
                  disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            <!-- Icon circle -->
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center
                shrink-0 text-white text-[11px]
                {contact.is_enabled ? 'bg-indigo-500' : 'bg-gray-300'}"
              aria-hidden="true"
            >
              {#if contact.type === 'whatsapp'}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              {:else if contact.type === 'telegram'}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              {:else if contact.type === 'phone'}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              {:else if contact.type === 'email'}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              {:else if contact.type === 'instagram'}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              {:else if contact.type === 'tiktok'}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              {:else if contact.type === 'custom_link'}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <span class="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                  {@html getContactIconSvg(contact.icon ?? 'globe')}
                </span>
              {/if}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {#if contact.type === 'custom_link'}
                  {contact.label || 'Custom link'}
                {:else}
                  {predefinedLabel(contact.type)}
                {/if}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {#if contact.type === 'custom_link'}
                  {contact.url ?? contact.value}
                {:else}
                  {contact.value || 'No value set'}
                {/if}
              </p>
            </div>

            <!-- Toggle -->
            <button
              type="button"
              onclick={() => doToggle(contact)}
              class="w-9 h-5 rounded-full transition-colors shrink-0
                {contact.is_enabled ? 'bg-indigo-600' : 'bg-gray-300'}"
              aria-label="{contact.is_enabled ? 'Disable' : 'Enable'} contact"
              aria-pressed={contact.is_enabled}
            >
              <div class="w-4 h-4 rounded-full bg-white shadow-sm transition-transform ml-0.5
                {contact.is_enabled ? 'translate-x-4' : 'translate-x-0'}">
              </div>
            </button>

            <!-- Edit -->
            <button
              type="button"
              onclick={() => openEdit(contact)}
              aria-label="Edit contact"
              aria-expanded={expandedId === contact.id}
              class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600
                hover:bg-indigo-50 transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>

            <!-- Delete -->
            <button
              type="button"
              onclick={() => doDelete(contact)}
              aria-label="Delete contact"
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-600
                hover:bg-red-50 transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>

          <!-- Edit form (expanded) -->
          {#if expandedId === contact.id}
            <div class="border-t border-gray-100 px-3 pb-3 pt-2 bg-gray-50">
              {#if contact.type === 'custom_link'}
                <!-- Custom link edit form -->
                <form
                  method="POST"
                  action="?/updateCustomContact"
                  use:enhance={() => {
                    return async ({ result }) => {
                      if (result.type === 'success') {
                        invalidateAll();
                        expandedId = null;
                        customEditId = null;
                        studio.showToast('Link updated');
                      } else if (result.type === 'failure') {
                        errorMsg = (result.data as any)?.error ?? 'Error saving';
                      }
                    };
                  }}
                  class="space-y-3"
                >
                  <input type="hidden" name="contactId" value={contact.id} />

                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1" for="edit-url-{contact.id}">
                      URL <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-url-{contact.id}"
                      type="url"
                      name="url"
                      bind:value={customUrl}
                      placeholder="https://example.com"
                      required
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <!-- Icon picker -->
                  <div>
                    <p class="text-xs font-medium text-gray-700 mb-2">Icon</p>
                    <div class="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Select icon">
                      {#each CONTACT_ICON_LIST as ic (ic.id)}
                        <button
                          type="button"
                          title={ic.label}
                          aria-label={ic.label}
                          aria-checked={customIcon === ic.id}
                          role="radio"
                          onclick={() => { customIcon = ic.id; }}
                          class="w-8 h-8 rounded-lg flex items-center justify-center
                            transition-all text-gray-600
                            {customIcon === ic.id
                              ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500'
                              : 'hover:bg-gray-100'}"
                        >
                          <span class="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
                            {@html getContactIconSvg(ic.id)}
                          </span>
                        </button>
                      {/each}
                    </div>
                    <input type="hidden" name="icon" value={customIcon} />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1" for="edit-label-{contact.id}">
                      Label (internal, optional)
                    </label>
                    <input
                      id="edit-label-{contact.id}"
                      type="text"
                      name="label"
                      bind:value={customLabel}
                      placeholder="e.g. My Discord server"
                      maxlength="80"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  {#if errorMsg}
                    <p class="text-xs text-red-600">{errorMsg}</p>
                  {/if}

                  <div class="flex gap-2">
                    <button
                      type="submit"
                      class="flex-1 px-3 py-1.5 text-sm font-medium text-white
                        bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onclick={() => { expandedId = null; errorMsg = ''; }}
                      class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100
                        rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              {:else}
                <!-- Predefined type edit form -->
                <form
                  method="POST"
                  action="?/updateContact"
                  use:enhance={() => {
                    return async ({ result }) => {
                      if (result.type === 'success') {
                        invalidateAll();
                        expandedId = null;
                        studio.showToast(`${predefinedLabel(contact.type)} updated`);
                      } else if (result.type === 'failure') {
                        errorMsg = (result.data as any)?.error ?? 'Error saving';
                      }
                    };
                  }}
                  class="space-y-2"
                >
                  <input type="hidden" name="type" value={contact.type} />
                  <input type="hidden" name="enabled" value={String(contact.is_enabled)} />

                  <div class="relative">
                    <input
                      type="text"
                      name="value"
                      bind:value={editValues[contact.id]}
                      placeholder={predefinedPlaceholder(contact.type)}
                      class="w-full px-3 py-2 pr-16 text-sm border border-gray-300
                        rounded-lg focus:ring-2 focus:ring-indigo-500
                        focus:border-indigo-500 text-gray-900"
                    />
                    <button
                      type="submit"
                      class="absolute right-1 top-1/2 -translate-y-1/2 px-2.5
                        py-0.5 text-xs font-medium text-indigo-600
                        hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      Save
                    </button>
                  </div>

                  {#if errorMsg}
                    <p class="text-xs text-red-600">{errorMsg}</p>
                  {/if}
                </form>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-sm text-gray-400 text-center py-4">
      No contacts yet. Add one below.
    </p>
  {/if}

  <!-- ── Add contact ────────────────────────────────────────── -->
  <div class="relative">
    <button
      type="button"
      onclick={openAddMenu}
      class="w-full flex items-center justify-center gap-2 px-4 py-2.5
        border-2 border-dashed border-gray-300 rounded-xl text-sm
        font-medium text-gray-600 hover:border-indigo-400
        hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      Add contact
    </button>

    {#if showAddMenu}
      <!-- Dropdown overlay to close on outside click -->
      <button
        type="button"
        class="fixed inset-0 z-10"
        aria-label="Close menu"
        onclick={() => { showAddMenu = false; }}
      ></button>

      <div
        class="absolute left-0 right-0 bottom-full mb-1 z-20 bg-white
          rounded-xl shadow-lg border border-gray-200 py-1 overflow-hidden"
        role="menu"
      >
        {#each PREDEFINED as p}
          {@const exists = existingPredefinedTypes.has(p.type)}
          <button
            type="button"
            onclick={() => { if (!exists) selectAddType(p.type); }}
            disabled={exists}
            role="menuitem"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm
              text-left transition-colors
              {exists
                ? 'opacity-40 cursor-not-allowed text-gray-500'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'}"
          >
            <span class="text-base">
              {p.type === 'whatsapp' ? '💬' : p.type === 'telegram' ? '✈️' : p.type === 'phone' ? '📞' : '✉️'}
            </span>
            {p.label}
            {#if exists}
              <span class="ml-auto text-xs text-gray-400">Added</span>
            {/if}
          </button>
        {/each}

        <div class="border-t border-gray-100 my-1"></div>

        <button
          type="button"
          onclick={() => selectAddType('custom_link')}
          role="menuitem"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm
            text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700
            transition-colors"
        >
          <span class="text-base">🔗</span>
          Custom link
        </button>
      </div>
    {/if}
  </div>

  <!-- ── Add predefined type form ──────────────────────────── -->
  {#if addingPredefined}
    {@const pd = PREDEFINED.find((p) => p.type === addingPredefined)!}
    <div class="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <p class="text-sm font-medium text-gray-700 mb-2">
        Add {pd.label}
      </p>
      <form
        method="POST"
        action="?/updateContact"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              invalidateAll();
              addingPredefined = null;
              addValue = '';
              studio.showToast(`${pd.label} added`);
            } else if (result.type === 'failure') {
              errorMsg = (result.data as any)?.error ?? 'Error saving';
            }
          };
        }}
        class="space-y-2"
      >
        <input type="hidden" name="type" value={addingPredefined} />
        <input type="hidden" name="enabled" value="true" />

        <input
          type="text"
          name="value"
          bind:value={addValue}
          placeholder={pd.placeholder}
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          autofocus
        />

        {#if errorMsg}
          <p class="text-xs text-red-600">{errorMsg}</p>
        {/if}

        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 px-3 py-1.5 text-sm font-medium text-white
              bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onclick={() => { addingPredefined = null; errorMsg = ''; }}
            class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100
              rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- ── Add custom link form ──────────────────────────────── -->
  {#if showCustomForm}
    <div class="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <p class="text-sm font-medium text-gray-700 mb-3">Add custom link</p>
      <form
        method="POST"
        action="?/createCustomContact"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              invalidateAll();
              showCustomForm = false;
              customUrl = '';
              customIcon = 'globe';
              customLabel = '';
              studio.showToast('Custom link added');
            } else if (result.type === 'failure') {
              errorMsg = (result.data as any)?.error ?? 'Error saving';
            }
          };
        }}
        class="space-y-3"
      >
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1" for="new-url">
            URL <span class="text-red-500">*</span>
          </label>
          <input
            id="new-url"
            type="url"
            name="url"
            bind:value={customUrl}
            placeholder="https://example.com"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <!-- Icon picker -->
        <div>
          <p class="text-xs font-medium text-gray-700 mb-2">Icon</p>
          <div class="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Select icon">
            {#each CONTACT_ICON_LIST as ic (ic.id)}
              <button
                type="button"
                title={ic.label}
                aria-label={ic.label}
                aria-checked={customIcon === ic.id}
                role="radio"
                onclick={() => { customIcon = ic.id; }}
                class="w-8 h-8 rounded-lg flex items-center justify-center
                  transition-all text-gray-600
                  {customIcon === ic.id
                    ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500'
                    : 'hover:bg-gray-100'}"
              >
                <span class="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
                  {@html getContactIconSvg(ic.id)}
                </span>
              </button>
            {/each}
          </div>
          <input type="hidden" name="icon" value={customIcon} />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1" for="new-label">
            Label (internal, optional)
          </label>
          <input
            id="new-label"
            type="text"
            name="label"
            bind:value={customLabel}
            placeholder="e.g. My Discord server"
            maxlength="80"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        {#if errorMsg}
          <p class="text-xs text-red-600">{errorMsg}</p>
        {/if}

        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 px-3 py-1.5 text-sm font-medium text-white
              bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Add link
          </button>
          <button
            type="button"
            onclick={() => { showCustomForm = false; errorMsg = ''; }}
            class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100
              rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Plan limit notice -->
  {#if plan === 'FREE'}
    {@const limit = 8}
    {@const used = contacts.length}
    {#if used >= limit - 1}
      <p class="mt-3 text-xs text-amber-600 text-center">
        {used}/{limit} contacts used
        {#if used >= limit}
          — <a href="/app/billing" class="underline font-medium">Upgrade to Pro</a> for unlimited
        {/if}
      </p>
    {/if}
  {/if}
</PanelShell>
