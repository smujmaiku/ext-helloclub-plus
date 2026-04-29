import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
	plugins: [
		webExtension({ disableAutoLaunch: true }),
		deno(),
	],
	build: {
		outDir: 'helloclub-plus',
	},
});
