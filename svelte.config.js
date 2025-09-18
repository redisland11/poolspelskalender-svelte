import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-auto'; // Byt tillbaka till adapter-auto

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter() // Använd den utan extra inställningar
	},
	preprocess: vitePreprocess()
};
export default config;