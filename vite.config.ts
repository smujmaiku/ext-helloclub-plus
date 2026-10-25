import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
	plugins: [
		webExtension({
			disableAutoLaunch: true,
			additionalInputs: ['offscreen.html'],
		}),
		deno(),
	],
	build: {
		outDir: 'helloclub-plus',
	},
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: 'preact',
	},
});
