import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://boardgame.sh';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/truthordare`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/werewolf`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
