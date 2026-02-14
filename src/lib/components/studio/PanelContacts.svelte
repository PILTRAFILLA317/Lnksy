<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { ProfileContact, ContactType } from '$lib/types.js';

  interface Props {
    contacts: ProfileContact[];
  }

  let { contacts }: Props = $props();

  const CONTACT_TYPES: {
    type: ContactType;
    label: string;
    placeholder: string;
  }[] = [
    { type: 'whatsapp', label: 'WhatsApp', placeholder: '+1234567890' },
    { type: 'telegram', label: 'Telegram', placeholder: '@username' },
    { type: 'phone', label: 'Phone', placeholder: '+1234567890' },
    { type: 'email', label: 'Email', placeholder: 'you@example.com' },
  ];

  let contactValues = $state<Record<string, string>>({});
  let contactEnabled = $state<Record<string, boolean>>({});

  $effect(() => {
    const vals: Record<string, string> = {};
    const enabled: Record<string, boolean> = {};
    for (const c of contacts) {
      vals[c.type] = c.value;
      enabled[c.type] = c.is_enabled;
    }
    contactValues = vals;
    contactEnabled = enabled;
  });

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
</script>

<PanelShell title="Contact Buttons">
  <p class="text-xs text-gray-500 mb-4">
    Add contact methods that appear as icon buttons on your page.
  </p>

  <div class="space-y-4">
    {#each CONTACT_TYPES as ct}
      {@const enabled = contactEnabled[ct.type] ?? false}
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onclick={() => {
              const newEnabled = !enabled;
              contactEnabled[ct.type] = newEnabled;
              const fd = new FormData();
              fd.set('type', ct.type);
              fd.set('value', contactValues[ct.type] ?? '');
              fd.set('enabled', String(newEnabled));
              fetch('/app?/updateContact', { method: 'POST', body: fd }).then(
                () => {
                  invalidateAll();
                  studio.showToast(
                    `${ct.label} ${newEnabled ? 'enabled' : 'disabled'}`,
                  );
                },
              );
            }}
            class="w-10 h-6 rounded-full transition-colors shrink-0
              min-h-[24px]
              {enabled ? 'bg-indigo-600' : 'bg-gray-300'}"
            aria-label="Toggle {ct.label}"
          >
            <div
              class="w-5 h-5 rounded-full bg-white shadow-sm
                transition-transform ml-0.5
                {enabled ? 'translate-x-4' : 'translate-x-0'}"
            ></div>
          </button>
          <span class="text-sm font-medium text-gray-900">{ct.label}</span>
        </div>

        {#if enabled}
          <form
            method="POST"
            action="?/updateContact"
            use:enhance={enhanceAction(`${ct.label} updated`)}
          >
            <input type="hidden" name="type" value={ct.type} />
            <input type="hidden" name="enabled" value="true" />
            <div class="relative">
              <input
                type="text"
                name="value"
                value={contactValues[ct.type] ?? ''}
                oninput={(e: Event) => {
                  contactValues[ct.type] = (e.target as HTMLInputElement).value;
                }}
                placeholder={ct.placeholder}
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
          </form>
        {/if}
      </div>
    {/each}
  </div>
</PanelShell>
