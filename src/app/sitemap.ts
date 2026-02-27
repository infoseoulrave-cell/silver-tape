import type { MetadataRoute } from 'next';
import { PRODUCTS } from '@/data/products';
import { STUDIOS } from '@/data/studios';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://silvertape.art';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/studios`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  const studioPages: MetadataRoute.Sitemap = STUDIOS.map(studio => ({
    url: `${baseUrl}/studio/${studio.slug}`,
    lastModified: new Date(studio.createdAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = PRODUCTS.map(product => ({
    url: `${baseUrl}/studio/${product.studioSlug}/${product.slug}`,
    lastModified: new Date(product.createdAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...studioPages, ...productPages];
}
