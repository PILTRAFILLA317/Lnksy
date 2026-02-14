<script lang="ts">
  interface Props {
    message?: string;
  }

  let { message = 'Upgrade to Pro to unlock this feature.' }: Props = $props();
</script>

<div class="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50
  border border-indigo-100 p-4">
  <p class="text-sm text-gray-700">{message}</p>
  <a
    href="/app/billing"
    class="inline-flex items-center gap-1 mt-2 text-sm font-semibold
      text-indigo-600 hover:text-indigo-700 transition-colors"
  >
    Upgrade to Pro
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 5l7 7-7 7" />
    </svg>
  </a>
</div>
