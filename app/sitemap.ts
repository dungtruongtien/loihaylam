import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://broadgame.app';
  return [
    { url: base, lastModified: new Date('2025-03-01'), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/truthordare`, lastModified: new Date('2025-03-01'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/werewolf`, lastModified: new Date('2025-03-01'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/privacy`, lastModified: new Date('2025-01-01'), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
