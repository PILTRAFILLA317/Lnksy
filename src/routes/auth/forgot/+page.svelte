<script lang="ts">
	import { enhance } from "$app/forms";
	import Button from "$lib/components/ui/Button.svelte";
	import Input from "$lib/components/ui/Input.svelte";

	interface Props {
		form: import("./$types.js").ActionData;
	}

	let { form }: Props = $props();
	let loading = $state(false);

	const sent = $derived((form as any)?.sent === true);
	const formError = $derived((form as any)?.error ?? "");
	const formEmail = $derived((form as any)?.email ?? "");
</script>

<svelte:head>
	<title>Recuperar contraseña — Lnksy</title>
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
>
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
			<p class="mt-2 text-sm text-gray-600">Recuperar contraseña</p>
		</div>

		<div class="bg-white rounded-2xl border border-gray-200 p-6">
			{#if sent}
				<div class="text-center">
					<div
						class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"
					>
						<svg
							class="w-6 h-6 text-green-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<p class="text-sm text-gray-600">
						Si existe una cuenta con <span class="font-semibold"
							>{formEmail}</span
						>, recibirás un email con instrucciones.
					</p>
				</div>
			{:else}
				<p class="text-sm text-gray-600 mb-4">
					Introduce tu email y te enviaremos un enlace para
					restablecer tu contraseña.
				</p>

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
					<Input
						type="email"
						label="Email"
						name="email"
						value={formEmail}
						placeholder="tu@email.com"
						autocomplete="email"
						error={formError}
						required
					/>

					<Button
						type="submit"
						variant="primary"
						size="lg"
						class="w-full mt-4"
						{loading}
					>
						Enviar enlace
					</Button>
				</form>
			{/if}

			<a
				href="/auth/login"
				class="block w-full mt-4 text-sm text-center text-gray-500 hover:text-gray-700"
			>
				← Volver al inicio de sesión
			</a>
		</div>
	</div>
</div>
