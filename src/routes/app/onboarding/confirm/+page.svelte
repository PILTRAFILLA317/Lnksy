<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let { data, form } = $props();

  let handle = $state(data.handle || form?.handle || '');
  let confirmed = $state(false);
  let loading = $state(false);
</script>

<svelte:head>
  <title>Create your Lnksy</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50
  px-4 py-12">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
      <h1 class="mt-4 text-xl font-semibold text-gray-900">
        Create your Lnksy
      </h1>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 p-6">
      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
      >
        <div class="space-y-4">
          <Input
            name="handle"
            label="Your handle"
            prefix="lnksy.com/"
            bind:value={handle}
            placeholder="tu-nombre"
            maxlength="24"
            error={form?.error ?? ''}
            required
          />

          <div class="bg-indigo-50 rounded-xl p-4">
            <p class="text-sm text-indigo-800 font-medium">
              Your URL will be
            </p>
            <p class="text-lg font-bold text-indigo-900 mt-1">
              lnksy.com/{handle || '...'}
            </p>
          </div>

          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="confirmed"
              bind:checked={confirmed}
              class="mt-0.5 w-4 h-4 rounded border-gray-300
                text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-gray-700">
              I understand that this handle
              <strong>cannot be changed</strong> after creation.
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            disabled={!confirmed || !handle}
            {loading}
          >
            Create my Lnksy
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
