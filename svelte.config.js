import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-static'; // <-- LÄGG TILL DENNA RAD

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ // <-- LÄGG TILL `kit`-OBJEKTET
			fallback: 'index.html' // Viktigt för single-page apps
		})
	},
	preprocess: vitePreprocess()
};
export default config;