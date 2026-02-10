<script lang="ts">
  import { page } from '$app/state';
  import { createClient } from '$lib/supabase.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let email = $state('');
  let loading = $state(false);
  let sent = $state(false);
  let error = $state('');

  const handle = $derived(page.url.searchParams.get('handle') ?? '');
  const redirectParam = $derived(
    page.url.searchParams.get('redirect') ?? ''
  );
  const redirectTo = $derived(
    (() => {
      const params = new URLSearchParams();
      if (handle) params.set('handle', handle);
      if (redirectParam) params.set('redirect', redirectParam);
      const suffix = params.toString();
      return `${page.url.origin}/auth/callback${
        suffix ? `?${suffix}` : ''
      }`;
    })()
  );

  async function signInWithEmail() {
    if (!email) return;
    loading = true;
    error = '';
    const supabase = createClient();

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (err) {
      error = err.message;
    } else {
      sent = true;
    }
    loading = false;
  }

  async function signInWithGoogle() {
    loading = true;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }

  async function signInWithApple() {
    loading = true;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    });
  }
</script>

<svelte:head>
  <title>Sign in — Lnksy</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50
  px-4 py-12">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <a href="/" class="text-2xl font-bold text-gray-900">
        Lnksy
      </a>
      <p class="mt-2 text-sm text-gray-600">
        {#if handle}
          Claim <span class="font-semibold">lnksy.com/{handle}</span>
        {:else}
          Sign in to your account
        {/if}
      </p>
    </div>

    {#if sent}
      <div class="bg-white rounded-2xl border border-gray-200 p-6
        text-center">
        <div class="w-12 h-12 rounded-full bg-green-100
          flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-green-600" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900">
          Check your email
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          We sent a magic link to
          <span class="font-medium">{email}</span>
        </p>
      </div>
    {:else}
      <div class="bg-white rounded-2xl border border-gray-200 p-6
        space-y-4">
        <!-- OAuth buttons -->
        <Button
          variant="outline"
          size="lg"
          class="w-full"
          onclick={signInWithGoogle}
          {loading}
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06
                 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92
                 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853"
              d="M12 23c2.97 0 5.46-.98
                 7.28-2.66l-3.57-2.77c-.98.66-2.23
                 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99
                 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43
                 8.55 1 10.22 1 12s.43 3.45 1.18
                 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56
                 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1
                 12 1 7.7 1 3.99 3.47 2.18
                 7.07l3.66 2.84c.87-2.6 3.3-4.53
                 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <Button
          variant="outline"
          size="lg"
          class="w-full"
          onclick={signInWithApple}
          {loading}
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24"
            fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23
                     0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05
                     7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93
                     3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38
                     5.98.48 7.13-.57 1.5-1.31 2.99-2.54
                     4.09zM12.03 7.25c-.15-2.23 1.66-4.07
                     3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </Button>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white px-2 text-gray-400">
              or
            </span>
          </div>
        </div>

        <!-- Magic link -->
        <form onsubmit={(e) => { e.preventDefault(); signInWithEmail(); }}>
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            bind:value={email}
            {error}
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            class="w-full mt-4"
            {loading}
          >
            Send magic link
          </Button>
        </form>
      </div>
    {/if}

    <p class="mt-6 text-center text-xs text-gray-400">
      By continuing, you agree to our Terms of Service and
      Privacy Policy.
    </p>
  </div>
</div>
