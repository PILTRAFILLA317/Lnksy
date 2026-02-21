import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			// Apunta a la carpeta convex/ en la raíz del proyecto
			// Permite importar: import { api } from '$convex/_generated/api'
			'$convex': './convex',
		},
	},
};

export default config;
