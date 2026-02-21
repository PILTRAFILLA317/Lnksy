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
	const formEmail = $derived((form as any)?.email ?? "");
	const redirectTo = $derived(
		(form as any)?.redirectTo ?? data.redirectTo ?? "",
	);
</script>

<svelte:head>
	<title>Iniciar sesión — Lnksy</title>
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
>
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
			<p class="mt-2 text-sm text-gray-600">Accede a tu cuenta</p>
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
				<input type="hidden" name="redirect" value={redirectTo} />
				<div class="space-y-4">
					<Input
						type="email"
						label="Email"
						name="email"
						value={formEmail}
						placeholder="tu@email.com"
						autocomplete="email"
						required
					/>
					<div>
						<Input
							type="password"
							label="Contraseña"
							name="password"
							placeholder="········"
							autocomplete="current-password"
							error={formError}
							required
						/>
						<a
							href="/auth/forgot"
							class="mt-1.5 inline-block text-xs text-indigo-600 hover:text-indigo-800"
						>
							¿Olvidaste tu contraseña?
						</a>
					</div>
				</div>

				<Button
					type="submit"
					variant="primary"
					size="lg"
					class="w-full mt-5"
					{loading}
				>
					Iniciar sesión
				</Button>
			</form>
		</div>

		<p class="mt-4 text-center text-sm text-gray-500">
			¿No tienes cuenta?{" "}
			<a
				href="/auth/signup"
				class="font-medium text-indigo-600 hover:text-indigo-800"
			>
				Regístrate
			</a>
		</p>
	</div>
</div>
