<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';

  let { data, form } = $props();

  let toast = $state({ message: '', type: 'success' as const, visible: false });
  let name = $state(data.profile?.name ?? '');
  let bio = $state(data.profile?.bio ?? '');
  let loading = $state(false);

  function showToast(
    message: string,
    type: 'success' | 'error' = 'success'
  ) {
    toast = { message, type, visible: true };
    setTimeout(() => { toast.visible = false; }, 3000);
  }
</script>

<svelte:head>
  <title>Settings — Lnksy</title>
</svelte:head>

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

<h1 class="text-lg font-semibold text-gray-900 mb-6">Settings</h1>

<!-- Handle (read-only) -->
<Card class="mb-4">
  <h2 class="text-sm font-medium text-gray-900 mb-3">Handle</h2>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-500">lnksy.com/</span>
    <span class="text-sm font-medium text-gray-900">
      {data.profile?.handle}
    </span>
  </div>
  <p class="text-xs text-gray-400 mt-1">
    This cannot be changed.
  </p>
</Card>

<!-- Profile info -->
<Card class="mb-4">
  <h2 class="text-sm font-medium text-gray-900 mb-3">Profile</h2>
  <form
    method="POST"
    action="?/updateProfile"
    use:enhance={() => {
      loading = true;
      return async ({ result }) => {
        loading = false;
        if (result.type === 'success') {
          invalidateAll();
          showToast('Profile updated');
        }
      };
    }}
  >
    <div class="space-y-4">
      <Input
        name="name"
        label="Display name"
        bind:value={name}
        placeholder="Your name"
      />
      <div>
        <label for="bio"
          class="block text-sm font-medium text-gray-700 mb-1.5">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows="3"
          bind:value={bio}
          placeholder="Tell people about yourself"
          class="block w-full text-sm px-3 py-2.5 border
            border-gray-300 bg-white text-gray-900
            placeholder-gray-400 rounded-xl
            focus:outline-none focus:ring-2
            focus:ring-indigo-500 focus:border-indigo-500
            resize-none"
          maxlength="200"
        ></textarea>
        <p class="text-xs text-gray-400 mt-1 text-right">
          {(bio ?? '').length}/200
        </p>
      </div>
      <Button type="submit" variant="primary" size="sm" {loading}>
        Save
      </Button>
    </div>
  </form>
</Card>

<!-- Avatar -->
<Card class="mb-4">
  <h2 class="text-sm font-medium text-gray-900 mb-3">Avatar</h2>
  <div class="flex items-center gap-4">
    {#if data.profile?.avatar_url}
      <img
        src={data.profile.avatar_url}
        alt="Avatar"
        class="w-16 h-16 rounded-full object-cover"
      />
    {:else}
      <div class="w-16 h-16 rounded-full bg-gray-200
        flex items-center justify-center text-xl font-bold
        text-gray-500">
        {(data.profile?.name ?? data.profile?.handle)?.[0]?.toUpperCase()}
      </div>
    {/if}
    <form
      method="POST"
      action="?/uploadAvatar"
      enctype="multipart/form-data"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            invalidateAll();
            showToast('Avatar updated');
          } else {
            showToast('Upload failed', 'error');
          }
        };
      }}
    >
      <label class="cursor-pointer">
        <input
          type="file"
          name="avatar"
          accept="image/*"
          class="hidden"
          onchange={(e) => {
            const form = (e.target as HTMLInputElement)
              .closest('form');
            if (form) form.requestSubmit();
          }}
        />
        <span class="text-sm text-indigo-600 hover:text-indigo-700
          font-medium">
          Change avatar
        </span>
      </label>
      <p class="text-xs text-gray-400 mt-0.5">
        Max 2MB, JPG/PNG
      </p>
    </form>
  </div>
</Card>

<!-- Danger zone -->
<Card class="border-red-200">
  <h2 class="text-sm font-medium text-red-600 mb-3">Danger zone</h2>
  <p class="text-sm text-gray-600 mb-4">
    Deleting your account will deactivate your public profile. This
    action can be reversed by contacting support within 30 days.
  </p>
  <form
    method="POST"
    action="?/deleteAccount"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          goto('/');
        }
      };
    }}
  >
    <Button
      type="submit"
      variant="danger"
      size="sm"
      onclick={(e: MouseEvent) => {
        if (
          !confirm(
            'Are you sure? Your profile will be deactivated.'
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      Delete account
    </Button>
  </form>
</Card>
