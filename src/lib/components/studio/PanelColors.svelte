<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { resolveThemeConfig, hasAdequateContrast } from '$lib/themes.js';
  import type { Profile, Theme, ThemeConfig, ThemeOverrides } from '$lib/types.js';

  interface Props {
    profile: Profile;
    themes: Theme[];
    isPro: boolean;
  }

  let { profile, themes, isPro }: Props = $props();

  // Derive active theme config + merged overrides
  const baseConfig = $derived(
    (themes.find((t) => t.id === profile.theme_id)?.config ?? null) as ThemeConfig | null,
  );
  const merged = $derived(
    baseConfig
      ? resolveThemeConfig(baseConfig, (profile.theme_overrides ?? {}) as ThemeOverrides)
      : null,
  );

  // ── Local state for preview (synced from merged via $effect) ──
  let localBg = $state('#ffffff');
  let localText = $state('#1a1a1a');
  let localAccent = $state('#6366f1');
  let localCardBg = $state('#f3f4f6');
  let localCardText = $state('#1a1a1a');
  let localRadius = $state('12px');
  let localButtonVariant = $state<'filled' | 'outline' | 'soft' | 'glass'>('filled');
  let localShadow = $state<'none' | 'soft' | 'medium' | 'strong'>('soft');
  let localIconStyle = $state<'mono' | 'brand'>('mono');

  // Sync from merged config whenever theme or overrides change
  $effect(() => {
    const m = merged;
    if (!m) return;
    localBg = m.bg.startsWith('#') ? m.bg : '#ffffff';
    localText = m.text ?? '#1a1a1a';
    localAccent = m.accent ?? '#6366f1';
    localCardBg = m.cardBg.startsWith('#') ? m.cardBg : '#f3f4f6';
    localCardText = m.cardText ?? '#1a1a1a';
    localRadius = m.cardRadius ?? '12px';
    localButtonVariant = m.buttonVariant ?? 'filled';
    localShadow = m.shadowIntensity ?? 'soft';
    localIconStyle = m.iconStyle ?? 'mono';
  });

  // Contrast warnings
  const bgTextContrast = $derived(hasAdequateContrast(localText, localBg));
  const cardContrast = $derived(hasAdequateContrast(localCardText, localCardBg));

  // Radius presets
  const RADIUS_PRESETS = [
    { label: 'None', value: '0px' },
    { label: 'S', value: '8px' },
    { label: 'M', value: '12px' },
    { label: 'L', value: '18px' },
    { label: 'Full', value: '999px' },
  ];

  const SHADOW_PRESETS = [
    { label: 'None', value: 'none' },
    { label: 'Soft', value: 'soft' },
    { label: 'Medium', value: 'medium' },
    { label: 'Strong', value: 'strong' },
  ] as const;

  const VARIANT_OPTIONS = [
    { label: 'Filled', value: 'filled', desc: 'Solid background' },
    { label: 'Outline', value: 'outline', desc: 'Border only' },
  ] as const;

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

<PanelShell title="Customize">
  {#if !isPro}
    <!-- FREE: limited overrides (accent color + radius) -->
    <form
      method="POST"
      action="?/updateOverrides"
      use:enhance={enhanceAction('Style updated')}
      class="space-y-5"
    >
      <div class="space-y-3">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Accent color
        </p>
        <label class="flex items-center gap-3 cursor-pointer group">
          <div class="relative">
            <input
              type="color"
              name="override_accent"
              bind:value={localAccent}
              class="w-10 h-10 rounded-lg cursor-pointer border border-gray-200
                ring-offset-1 group-hover:ring-2 ring-indigo-300"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Accent</p>
            <p class="text-xs text-gray-500">{localAccent}</p>
          </div>
        </label>
      </div>

      <div class="space-y-3">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Card radius
        </p>
        <div class="flex gap-1.5 flex-wrap">
          {#each RADIUS_PRESETS as r (r.value)}
            <label class="cursor-pointer">
              <input type="radio" name="override_cardRadius" value={r.value}
                bind:group={localRadius} class="sr-only" />
              <span class="inline-flex items-center px-3 py-1.5 text-xs font-medium
                border-2 rounded-lg transition-all
                {localRadius === r.value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}">
                {r.label}
              </span>
            </label>
          {/each}
        </div>
      </div>

      <div class="pt-2 space-y-2">
        <button
          type="submit"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm
            font-semibold rounded-xl transition-colors"
        >
          Save changes
        </button>
        <a
          href="/app/billing"
          class="w-full flex items-center justify-center gap-1.5 py-2 text-xs
            text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 3l14 9-14 9V3z" />
          </svg>
          Unlock full customization with Pro
        </a>
      </div>
    </form>

  {:else}
    <!-- PRO: full controls -->
    <form
      method="POST"
      action="?/updateOverrides"
      use:enhance={enhanceAction('Customization saved')}
      class="space-y-6"
    >
      <!-- Colors section -->
      <section class="space-y-3">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colors</p>

        <div class="grid grid-cols-2 gap-3">
          <!-- Background -->
          <label class="space-y-1.5 cursor-pointer">
            <span class="text-xs text-gray-600 font-medium">Background</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                name="override_bg"
                bind:value={localBg}
                class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <span class="text-xs text-gray-500 font-mono truncate">{localBg}</span>
            </div>
            {#if !bgTextContrast}
              <p class="text-[10px] text-amber-600 flex items-center gap-0.5">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Low contrast
              </p>
            {/if}
          </label>

          <!-- Text -->
          <label class="space-y-1.5 cursor-pointer">
            <span class="text-xs text-gray-600 font-medium">Text</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                name="override_text"
                bind:value={localText}
                class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <span class="text-xs text-gray-500 font-mono truncate">{localText}</span>
            </div>
          </label>

          <!-- Accent -->
          <label class="space-y-1.5 cursor-pointer">
            <span class="text-xs text-gray-600 font-medium">Accent</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                name="override_accent"
                bind:value={localAccent}
                class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <span class="text-xs text-gray-500 font-mono truncate">{localAccent}</span>
            </div>
          </label>

          <!-- Card background -->
          <label class="space-y-1.5 cursor-pointer">
            <span class="text-xs text-gray-600 font-medium">Card background</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                name="override_cardBg"
                bind:value={localCardBg}
                class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <span class="text-xs text-gray-500 font-mono truncate">{localCardBg}</span>
            </div>
            {#if !cardContrast}
              <p class="text-[10px] text-amber-600 flex items-center gap-0.5">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Low contrast
              </p>
            {/if}
          </label>

          <!-- Card text -->
          <label class="space-y-1.5 cursor-pointer col-span-2">
            <span class="text-xs text-gray-600 font-medium">Card text</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                name="override_cardText"
                bind:value={localCardText}
                class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <span class="text-xs text-gray-500 font-mono truncate">{localCardText}</span>
            </div>
          </label>
        </div>
      </section>

      <!-- Radius -->
      <section class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Corner radius</p>
        <div class="flex gap-1.5 flex-wrap">
          {#each RADIUS_PRESETS as r (r.value)}
            <label class="cursor-pointer">
              <input type="radio" name="override_cardRadius" value={r.value}
                bind:group={localRadius} class="sr-only" />
              <span
                class="inline-flex flex-col items-center px-3 py-2 text-xs font-medium
                  border-2 transition-all select-none"
                style="border-radius: {r.value === '999px' ? '999px' : '8px'};
                  {localRadius === r.value
                    ? 'border-color: #4f46e5; background: #eef2ff; color: #4338ca;'
                    : 'border-color: #e5e7eb; color: #6b7280;'}"
              >
                <!-- Visual radius preview -->
                <span
                  class="block w-6 h-4 mb-0.5 border-2 border-current opacity-60"
                  style="border-radius: {r.value === '999px' ? '999px' : `calc(${r.value} * 0.6)`};"
                ></span>
                {r.label}
              </span>
            </label>
          {/each}
        </div>
      </section>

      <!-- Button variant -->
      <section class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Button style</p>
        <div class="grid grid-cols-2 gap-2">
          {#each VARIANT_OPTIONS as opt (opt.value)}
            <label class="cursor-pointer">
              <input type="radio" name="override_buttonVariant" value={opt.value}
                bind:group={localButtonVariant} class="sr-only" />
              <span
                class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2
                  transition-all text-center
                  {localButtonVariant === opt.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'}"
              >
                <!-- Mini button preview -->
                <span
                  class="w-full h-5 flex items-center justify-center text-[8px] font-bold
                    rounded-md transition-all"
                  style="
                    {opt.value === 'filled'
                      ? `background: ${localAccent}; color: #fff;`
                      : `background: transparent; border: 1.5px solid ${localAccent}; color: ${localAccent};`}
                    border-radius: calc({localRadius} * 0.5);
                  "
                >
                  Link
                </span>
                <span class="text-xs font-medium
                  {localButtonVariant === opt.value ? 'text-indigo-700' : 'text-gray-600'}">
                  {opt.label}
                </span>
              </span>
            </label>
          {/each}
        </div>
      </section>

      <!-- Shadow intensity -->
      <section class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shadow</p>
        <div class="flex gap-1.5 flex-wrap">
          {#each SHADOW_PRESETS as s (s.value)}
            <label class="cursor-pointer">
              <input type="radio" name="override_shadowIntensity" value={s.value}
                bind:group={localShadow} class="sr-only" />
              <span class="inline-flex items-center px-3 py-1.5 text-xs font-medium
                border-2 rounded-lg transition-all
                {localShadow === s.value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}">
                {s.label}
              </span>
            </label>
          {/each}
        </div>
      </section>

      <!-- Icon style (PRO: brand icons) -->
      <section class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Icon style
          <span class="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
        </p>
        <div class="grid grid-cols-2 gap-2">
          <label class="cursor-pointer">
            <input type="radio" name="override_iconStyle" value="mono"
              bind:group={localIconStyle} class="sr-only" />
            <span
              class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2
                transition-all text-center
                {localIconStyle === 'mono'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'}"
            >
              <svg class="w-5 h-5 {localIconStyle === 'mono' ? 'text-indigo-600' : 'text-gray-400'}"
                viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
              <span class="text-xs font-medium
                {localIconStyle === 'mono' ? 'text-indigo-700' : 'text-gray-600'}">
                Mono
              </span>
            </span>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="override_iconStyle" value="brand"
              bind:group={localIconStyle} class="sr-only" />
            <span
              class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2
                transition-all text-center
                {localIconStyle === 'brand'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'}"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="12" r="4" fill="#1DA1F2"/>
                <circle cx="16" cy="12" r="4" fill="#E1306C"/>
              </svg>
              <span class="text-xs font-medium
                {localIconStyle === 'brand' ? 'text-indigo-700' : 'text-gray-600'}">
                Brand
              </span>
            </span>
          </label>
        </div>
        <p class="text-[10px] text-gray-400">Brand colors shown on social icons</p>
      </section>

      <!-- Save button -->
      <div class="pt-1">
        <button
          type="submit"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm
            font-semibold rounded-xl transition-colors"
        >
          Save customization
        </button>
      </div>
    </form>

    <!-- Reset form — must be OUTSIDE the customize form (no nested forms) -->
    <form
      method="POST"
      action="?/resetOverrides"
      use:enhance={enhanceAction('Reset to theme defaults')}
      class="mt-2"
    >
      <button
        type="submit"
        class="w-full py-2 text-xs text-gray-500 hover:text-gray-700 font-medium
          transition-colors hover:bg-gray-50 rounded-lg"
      >
        Reset to theme defaults
      </button>
    </form>
  {/if}
</PanelShell>
