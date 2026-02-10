<script lang="ts">
  import './layout.css';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import {
    createClient,
    supabaseConfigured,
  } from '$lib/supabase.js';

  interface Props {
    data: import('./$types.js').LayoutServerData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  onMount(() => {
    if (!supabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth');
    });
    return () => subscription.unsubscribe();
  });
</script>

<svelte:head>
  <title>Lnksy — Your links, your style</title>
</svelte:head>

{@render children()}
