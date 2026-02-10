<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    prefix?: string;
    value?: string;
  }

  let {
    label,
    error,
    prefix,
    value = $bindable(''),
    class: className = '',
    id,
    ...rest
  }: Props = $props();

  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
</script>

<div class="w-full">
  {#if label}
    <label
      for={inputId}
      class="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {label}
    </label>
  {/if}
  <div class="relative flex">
    {#if prefix}
      <span
        class="inline-flex items-center px-3 rounded-l-xl border
          border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
      >
        {prefix}
      </span>
    {/if}
    <input
      id={inputId}
      bind:value
      class="block w-full text-sm px-3 py-2.5 border border-gray-300
        bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-indigo-500
        focus:border-indigo-500 disabled:bg-gray-50
        disabled:text-gray-500 transition-colors
        {prefix ? 'rounded-r-xl' : 'rounded-xl'}
        {error
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : ''}
        {className}"
      {...rest}
    />
  </div>
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>
