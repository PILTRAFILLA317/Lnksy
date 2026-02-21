<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  interface Props {
    form: import('./$types.js').ActionData;
  }

  let { form }: Props = $props();
  let loading = $state(false);

  const formError = $derived((form as any)?.error ?? '');
  const formEmail = $derived((form as any)?.email ?? '');
</script>

<svelte:head>
  <title>Crear cuenta — Lnksy</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <a href="/" class="text-2xl font-bold text-gray-900">Lnksy</a>
      <p class="mt-2 text-sm text-gray-600">Crea tu cuenta</p>
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
            type="email"
            label="Email"
            name="email"
            value={formEmail}
            placeholder="tu@email.com"
            autocomplete="email"
            required
          />
          <Input
            type="password"
            label="Contraseña"
            name="password"
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
          Crear cuenta
        </Button>
      </form>
    </div>

    <p class="mt-4 text-center text-sm text-gray-500">
      ¿Ya tienes cuenta?{' '}
      <a
        href="/auth/login"
        class="font-medium text-indigo-600 hover:text-indigo-800"
      >
        Iniciar sesión
      </a>
    </p>

    <p class="mt-4 text-center text-xs text-gray-400">
      Al continuar aceptas nuestros Términos de Servicio y
      Política de Privacidad.
    </p>
  </div>
</div>
