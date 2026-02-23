<script lang="ts">
  import { studio } from "$lib/stores/studio.svelte.js";
  import Toast from "$lib/components/ui/Toast.svelte";
  import EditorRail from "$lib/components/studio/EditorRail.svelte";
  import EditorPanelHost from "$lib/components/studio/EditorPanelHost.svelte";
  import StudioPreview from "$lib/components/studio/StudioPreview.svelte";
  import type {
    Link,
    ProfileComponent,
    Theme,
    Font,
    Background,
    ProfileContact,
    Profile,
  } from "$lib/types.js";

  let { data } = $props();

  const profile = $derived(data.profile as Profile);
  const links = $derived((data.links ?? []) as Link[]);
  const components = $derived((data.components ?? []) as ProfileComponent[]);
  const themes = $derived((data.themes ?? []) as Theme[]);
  const fonts = $derived((data.fonts ?? []) as Font[]);
  const backgrounds = $derived((data.backgrounds ?? []) as Background[]);
  const contacts = $derived((data.contacts ?? []) as ProfileContact[]);
  const isPro = $derived(profile?.plan === "PRO");
</script>

<svelte:head>
  <title>Editor — Lnksy</title>
</svelte:head>

<Toast
  message={studio.toastMessage}
  type={studio.toastType}
  visible={studio.toastVisible}
/>

{#if profile}
  <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
    <!-- Mobile chip strip for subcategories (visible <lg) -->
    <div class="lg:hidden">
      <EditorRail variant="mobile" />
    </div>

    <!-- Main studio area -->
    <div class="flex-1 min-h-0 flex lg:gap-6 overflow-hidden">
      <!-- Desktop vertical rail (visible >=lg) -->
      <div class="hidden lg:flex h-full">
        <EditorRail variant="desktop" />
      </div>

      <!-- Phone preview (center) -->
      <div class="flex-1 relative min-h-0 min-w-0 overflow-hidden">
        <StudioPreview
          {profile}
          {links}
          {components}
          {themes}
          {contacts}
          {fonts}
          {backgrounds}
          {isPro}
        />
      </div>

      <!-- Desktop panel (right column, visible >=lg) -->
      {#if studio.openPanel}
        <div
          class="hidden lg:block w-95 shrink-0 relative
            border-l border-gray-200 bg-white"
        >
          <div class="absolute inset-0 overflow-hidden flex flex-col">
            <EditorPanelHost
              {profile}
              {links}
              {components}
              {themes}
              {fonts}
              {backgrounds}
              {contacts}
              {isPro}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- Mobile panel (bottom sheet overlay, visible <lg) -->
    {#if studio.openPanel}
      <!-- Backdrop -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="lg:hidden fixed inset-0 bg-black/30 z-40
          animate-studio-fade-in"
        onclick={() => studio.closePanel()}
      ></div>

      <!-- Panel -->
      <div
        class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white
          rounded-t-2xl shadow-2xl animate-studio-slide-up
          max-h-[85vh] overflow-hidden flex flex-col"
        style="padding-bottom: env(safe-area-inset-bottom, 0px);"
      >
        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <EditorPanelHost
            {profile}
            {links}
            {components}
            {themes}
            {fonts}
            {backgrounds}
            {contacts}
            {isPro}
          />
        </div>
      </div>
    {/if}
  </div>
{/if}
