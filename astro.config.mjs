import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Quando publicar no GitHub Pages, o site fica em https://<usuario>.github.io/bg3-blog/
export default defineConfig({
  base: '/bg3-blog',
  integrations: [mdx()],
});
