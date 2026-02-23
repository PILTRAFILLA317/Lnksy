<script lang="ts">
  import { studio } from '$lib/stores/studio.svelte.js';
  import PanelComponents from './PanelComponents.svelte';
  import PanelHeader from './PanelHeader.svelte';
  import PanelTitleBio from './PanelTitleBio.svelte';
  import PanelContacts from './PanelContacts.svelte';
  import PanelAppearance from './PanelAppearance.svelte';
  import PanelBackground from './PanelBackground.svelte';
  import PanelColors from './PanelColors.svelte';
  import PanelFonts from './PanelFonts.svelte';
  import PanelBranding from './PanelBranding.svelte';
  import type {
    Link,
    ProfileComponent,
    Profile,
    Theme,
    Font,
    Background,
    ProfileContact,
  } from '$lib/types.js';

  interface Props {
    profile: Profile;
    links: Link[];
    components: ProfileComponent[];
    themes: Theme[];
    fonts: Font[];
    backgrounds: Background[];
    contacts: ProfileContact[];
    isPro: boolean;
  }

  let { profile, links, components, themes, fonts, backgrounds, contacts, isPro }: Props =
    $props();
</script>

{#if studio.openPanel === 'components'}
  <PanelComponents {links} {components} {profile} {isPro} />
{:else if studio.openPanel === 'header'}
  <PanelHeader {profile} {isPro} />
{:else if studio.openPanel === 'title'}
  <PanelTitleBio {profile} {isPro} />
{:else if studio.openPanel === 'contacts'}
  <PanelContacts {contacts} />
{:else if studio.openPanel === 'theme'}
  <PanelAppearance {profile} {themes} {isPro} />
{:else if studio.openPanel === 'background'}
  <PanelBackground {backgrounds} {profile} {isPro} />
{:else if studio.openPanel === 'customize'}
  <PanelColors {profile} {themes} {isPro} />
{:else if studio.openPanel === 'fonts'}
  <PanelFonts {fonts} {profile} {isPro} />
{:else if studio.openPanel === 'branding'}
  <PanelBranding {profile} {isPro} />
{/if}
