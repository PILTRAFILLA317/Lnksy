<script lang="ts">
	import { enhance } from "$app/forms";
	import Button from "$lib/components/ui/Button.svelte";

	interface Props {
		data: import("./$types.js").PageData;
		form: import("./$types.js").ActionData;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);

	const sent = $derived((form as any)?.success === true);
	const formError = $derived((form as any)?.error ?? "");

	const errorMessage = $derived(() => {
		if (data.error === "expired") {
			return "El enlace ha caducado. Solicita uno nuevo.";
		}
		if (data.error === "invalid") {
			return "Enlace inválido. Solicita uno nuevo.";
		}
		return formError;
	});
</script>

<svelte:head>
	<title>Verificar email — Lnksy</title>
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
>
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
			<p class="mt-2 text-sm text-gray-600">Verificación de email</p>
		</div>

		<div class="bg-white rounded-2xl border border-gray-200 p-6">
			<div class="text-center mb-5">
				<div
					class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3"
				>
					<svg
						class="w-6 h-6 text-indigo-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<p class="text-sm text-gray-600">
					Hemos enviado un enlace de verificación a<br />
					<span class="font-semibold text-gray-900">{data.email}</span
					>
				</p>
				<p class="text-xs text-gray-400 mt-2">
					Revisa tu bandeja de entrada (y spam).
				</p>
			</div>

			{#if sent}
				<div
					class="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4 text-center"
				>
					¡Email reenviado correctamente!
				</div>
			{/if}

			{#if errorMessage()}
				<div
					class="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4 text-center"
				>
					{errorMessage()}
				</div>
			{/if}

			<form
				method="POST"
				action="?/resend"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<Button
					type="submit"
					variant="primary"
					size="lg"
					class="w-full"
					{loading}
				>
					Reenviar email
				</Button>
			</form>

			<a
				href="/auth/login"
				class="block w-full mt-3 text-sm text-center text-gray-500 hover:text-gray-700"
			>
				← Volver al inicio de sesión
			</a>
		</div>
	</div>
</div>
