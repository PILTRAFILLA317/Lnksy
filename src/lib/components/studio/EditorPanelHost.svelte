<script lang="ts">
  import { studio } from '$lib/stores/studio.svelte.js';
  import PanelLinks from './PanelLinks.svelte';
  import PanelHeader from './PanelHeader.svelte';
  import PanelTitleBio from './PanelTitleBio.svelte';
  import PanelContacts from './PanelContacts.svelte';
  import PanelThemes from './PanelThemes.svelte';
  import PanelLayout from './PanelLayout.svelte';
  import PanelBackground from './PanelBackground.svelte';
  import PanelFonts from './PanelFonts.svelte';
  import PanelColors from './PanelColors.svelte';
  import PanelBranding from './PanelBranding.svelte';
  import type {
    Link,
    Profile,
    Theme,
    Font,
    Background,
    ProfileContact,
  } from '$lib/types.js';

  interface Props {
    profile: Profile;
    links: Link[];
    themes: Theme[];
    fonts: Font[];
    backgrounds: Background[];
    contacts: ProfileContact[];
    isPro: boolean;
  }

  let { profile, links, themes, fonts, backgrounds, contacts, isPro }: Props =
    $props();
</script>

{#if studio.openPanel === 'links'}
  <PanelLinks {links} {isPro} />
{:else if studio.openPanel === 'header'}
  <PanelHeader {profile} {isPro} />
{:else if studio.openPanel === 'title'}
  <PanelTitleBio {profile} {isPro} />
{:else if studio.openPanel === 'contacts'}
  <PanelContacts {contacts} />
{:else if studio.openPanel === 'themes'}
  <PanelThemes {themes} {profile} {isPro} />
{:else if studio.openPanel === 'layout'}
  <PanelLayout {profile} {isPro} />
{:else if studio.openPanel === 'background'}
  <PanelBackground {backgrounds} {profile} {isPro} />
{:else if studio.openPanel === 'fonts'}
  <PanelFonts {fonts} {profile} {isPro} />
{:else if studio.openPanel === 'colors'}
  <PanelColors {profile} {isPro} />
{:else if studio.openPanel === 'branding'}
  <PanelBranding {profile} {isPro} />
{/if}
