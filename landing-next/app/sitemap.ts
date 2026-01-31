import { MetadataRoute } from 'next';

const locales = ['en', 'ru', 'de', 'fr', 'es', 'zh'];
const baseUrl = 'https://fitstream.health';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  // Homepage for each locale
  for (const locale of locales) {
    routes.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    });

    // Features page
    routes.push({
      url: `${baseUrl}/${locale}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Download page
    routes.push({
      url: `${baseUrl}/${locale}/download`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    });

    // Pricing page
    routes.push({
      url: `${baseUrl}/${locale}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  // Root redirect
  routes.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  });

  return routes;
}
