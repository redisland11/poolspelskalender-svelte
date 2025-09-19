// vite.config.js
import tailwindcss from '@tailwindcss/vite'; // Din befintliga import
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit'; // Den nya importen för PWA
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(), // Din befintliga Tailwind-plugin
		
		// Den nya PWA-pluginen med alla inställningar
		SvelteKitPWA({
			manifest: {
				name: 'Poolspelskalender',
				short_name: 'Spelkalender',
				description: 'En kalender för poolspel från ATG och Svenska Spel.',
				theme_color: '#a00813', // Färgen på statusfältet i mobilen
				background_color: '#1a202c', // Färgen som visas när appen startar
				display: 'standalone', // Öppnas som en egen app
				start_url: '/',
				icons: [
					{
						src: 'web-app-manifest-192x192.png', // Se till att filnamnen matchar de du la i /static
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'web-app-manifest-512x512.png', // Se till att filnamnen matchar de du la i /static
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'web-app-manifest-512x512.png', // En "maskable" ikon är bra att ha
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}']
			}
		})
	]
});