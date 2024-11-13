import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';

const dev = process.env.NODE_ENV !== 'production';

export default defineConfig({
	plugins: [sveltekit()],
	base: dev ? '' : '/RandSqrt',
	server: {
		hmr: dev
	}
});
