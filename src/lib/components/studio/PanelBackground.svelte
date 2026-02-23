<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Background, Profile } from '$lib/types.js';

  interface Props {
    backgrounds: Background[];
    profile: Profile;
    isPro: boolean;
  }

  let { backgrounds, profile, isPro }: Props = $props();

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

  // Local slider state (debounced POST)
  let overlayVal = $state(profile.background_overlay ?? 0);
  let blurVal = $state(profile.background_blur_px ?? 0);
  let settingsTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleSettingsUpdate() {
    if (settingsTimer) clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => {
      const fd = new FormData();
      fd.set('overlay', String(overlayVal));
      fd.set('blur', String(blurVal));
      fetch('/app?/updateBackgroundSettings', { method: 'POST', body: fd })
        .then(() => invalidateAll());
    }, 400);
  }

  function removeImage() {
    const fd = new FormData();
    fd.set('overlay', String(overlayVal));
    fd.set('blur', String(blurVal));
    fd.set('removeImage', '1');
    fetch('/app?/updateBackgroundSettings', { method: 'POST', body: fd })
      .then(() => {
        invalidateAll();
        studio.showToast('Background image removed');
      });
  }

  const hasBgImage = $derived(!!profile.background_image_url);
  const downgradeWarning = $derived(!isPro && hasBgImage);
</script>

<PanelShell title="Background">

  <!-- PRO: Background Image section -->
  {#if isPro}
    <div class="mb-5">
      <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Background Image
        <span class="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
      </h3>

      {#if hasBgImage}
        <!-- Preview -->
        <div class="relative mb-3 rounded-xl overflow-hidden h-24 bg-gray-100">
          <img
            src={profile.background_image_url}
            alt="Background"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0"
            style="background: rgba(0,0,0,{overlayVal}); backdrop-filter: blur({blurVal}px);"
          ></div>
          <button
            onclick={removeImage}
            class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white
              flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Remove background image"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Overlay slider -->
        <div class="mb-3">
          <div class="flex justify-between mb-1">
            <label class="text-[11px] font-medium text-gray-500">Overlay darkness</label>
            <span class="text-[11px] text-gray-400">{Math.round(overlayVal * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="0.85" step="0.05"
            bind:value={overlayVal}
            oninput={scheduleSettingsUpdate}
            class="w-full h-1.5 rounded-full accent-indigo-600"
          />
        </div>

        <!-- Blur slider -->
        <div class="mb-4">
          <div class="flex justify-between mb-1">
            <label class="text-[11px] font-medium text-gray-500">Background blur</label>
            <span class="text-[11px] text-gray-400">{blurVal}px</span>
          </div>
          <input
            type="range" min="0" max="24" step="1"
            bind:value={blurVal}
            oninput={scheduleSettingsUpdate}
            class="w-full h-1.5 rounded-full accent-indigo-600"
          />
        </div>
      {:else}
        <!-- Upload -->
        <form
          method="POST"
          action="?/uploadBackgroundImage"
          enctype="multipart/form-data"
          use:enhance={enhanceAction('Background image uploaded')}
          class="mb-4"
        >
          <label
            class="flex flex-col items-center justify-center gap-2 w-full py-5 rounded-xl
              border-2 border-dashed border-gray-200 hover:border-indigo-300
              text-sm text-gray-400 hover:text-indigo-600 cursor-pointer
              bg-gray-50/60 hover:bg-indigo-50/30 transition-all"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            <span class="text-xs font-medium">Upload background image</span>
            <span class="text-[10px] text-gray-400">Max 8 MB · JPG, PNG, WebP</span>
            <input type="file" name="bgImage" accept="image/*" class="hidden"
              onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
            />
          </label>
        </form>
      {/if}
    </div>

    <div class="border-t border-gray-100 mb-5"></div>

  {:else if downgradeWarning}
    <div class="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
      <p class="text-xs text-amber-700 font-medium">
        Your background image is hidden (PRO feature). Upgrade to show it again.
      </p>
      <button
        onclick={() => goto('/app/billing')}
        class="mt-2 text-xs text-amber-700 font-semibold underline hover:text-amber-900"
      >Upgrade to PRO</button>
    </div>
  {:else if !isPro}
    <div class="mb-5">
      <UpgradeCTA message="Upload a custom background image with overlay and blur controls." />
    </div>
    <div class="border-t border-gray-100 mb-5"></div>
  {/if}

  <!-- Background presets grid -->
  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
    Color Presets
  </h3>
  <div class="grid grid-cols-3 gap-2.5">
    {#each backgrounds as bg (bg.id)}
      {@const selected = profile.background_id === bg.id}
      {@const locked = bg.is_pro && !isPro}
      <form
        method="POST"
        action="?/selectBackground"
        use:enhance={enhanceAction('Background updated')}
      >
        <input type="hidden" name="backgroundId" value={bg.id} />
        <button
          type={locked ? 'button' : 'submit'}
          onclick={locked ? () => goto('/app/billing') : undefined}
          class="w-full rounded-xl border-2 overflow-hidden transition-all
            {selected
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300'}
            {locked ? 'opacity-50' : ''}"
        >
          <div class="h-12 w-full" style="background: {bg.value};"></div>
          <p class="text-[10px] font-medium text-gray-700 py-1.5 px-1
            flex items-center justify-center gap-1 leading-tight">
            {bg.name}
            {#if bg.is_pro}
              <span class="text-[8px] bg-indigo-100 text-indigo-700
                px-1 py-0.5 rounded-full font-semibold">PRO</span>
            {/if}
          </p>
        </button>
      </form>
    {/each}
  </div>
</PanelShell>
