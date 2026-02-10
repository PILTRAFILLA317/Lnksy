<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    class: className = '',
    disabled,
    ...rest
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center font-medium ' +
    'transition-colors focus-visible:outline-2 ' +
    'focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ' +
    'disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline:
      'border border-gray-300 bg-transparent text-gray-700 ' +
      'hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes: Record<string, string> = {
    sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2',
  };
</script>

<button
  class="{base} {variants[variant]} {sizes[size]} {className}"
  disabled={disabled || loading}
  {...rest}
>
  {#if loading}
    <svg
      class="animate-spin -ml-1 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  {/if}
  {@render children()}
</button>
