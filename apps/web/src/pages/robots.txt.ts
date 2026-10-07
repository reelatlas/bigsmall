import type { APIRoute } from 'astro';

/**
 * Every page may be crawled; the /dev pages ask not to be indexed with their own meta tag, which a
 * crawler can only read if it may fetch them. The sitemap's address comes from Astro's `site`.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
