<script lang="ts">
	import { enhance } from "$app/forms";
	import Button from "$lib/components/ui/Button.svelte";
	import Input from "$lib/components/ui/Input.svelte";

	interface Props {
		data: import("./$types.js").PageData;
		form: import("./$types.js").ActionData;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);

	const formError = $derived((form as any)?.error ?? "");
	const token = $derived((form as any)?.token ?? data.token ?? "");
</script>

<svelte:head>
	<title>Nueva contraseña — Lnksy</title>
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
>
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
			<p class="mt-2 text-sm text-gray-600">Nueva contraseña</p>
		</div>

		<div class="bg-white rounded-2xl border border-gray-200 p-6">
			{#if !token}
				<div class="text-center">
					<p class="text-sm text-red-600 mb-4">
						{formError || "Enlace inválido."}
					</p>
					<a
						href="/auth/forgot"
						class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
					>
						Solicitar nuevo enlace
					</a>
				</div>
			{:else}
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
					<input type="hidden" name="token" value={token} />
					<div class="space-y-4">
						<Input
							type="password"
							label="Nueva contraseña"
							name="newPassword"
							placeholder="Mínimo 8 caracteres"
							autocomplete="new-password"
							required
						/>
						<Input
							type="password"
							label="Confirmar contraseña"
							name="confirmPassword"
							placeholder="Repite la contraseña"
							autocomplete="new-password"
							error={formError}
							required
						/>
					</div>

					<Button
						type="submit"
						variant="primary"
						size="lg"
						class="w-full mt-5"
						{loading}
					>
						Restablecer contraseña
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
