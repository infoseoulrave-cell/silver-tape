import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import { getProductBySlug, getProductsByStudio } from '@/data/products';
import { getStudioBySlug, STUDIOS } from '@/data/studios';
import { getCategoryById } from '@/data/categories';
import { SIZE_OPTIONS } from '@/data/pricing';

const SITE_URL = 'https://silvertape.art';

interface ProductPageProps {
  params: Promise<{ studioSlug: string; productSlug: string }>;
}

export async function generateStaticParams() {
  const params: { studioSlug: string; productSlug: string }[] = [];
  for (const studio of STUDIOS) {
    const products = getProductsByStudio(studio.slug);
    for (const product of products) {
      params.push({ studioSlug: studio.slug, productSlug: product.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { studioSlug, productSlug } = await params;
  const product = getProductBySlug(productSlug);
  if (!product) return { title: 'Product Not Found' };

  const pageUrl = `${SITE_URL}/studio/${studioSlug}/${productSlug}`;
  const imageUrl = `${SITE_URL}${product.image}`;

  return {
    title: `${product.title} — ${product.titleKo}`,
    description: product.descriptionKo,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${product.title} | SILVERTAPE`,
      description: product.descriptionKo,
      images: [{ url: imageUrl, width: 600, height: 800, alt: `${product.title} 아트 포스터` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | SILVERTAPE`,
      description: product.descriptionKo,
      images: [imageUrl],
    },
  };
}

export default async function StudioProductPage({ params }: ProductPageProps) {
  const { studioSlug, productSlug } = await params;
  const studio = getStudioBySlug(studioSlug);
  if (!studio) notFound();

  const product = getProductBySlug(productSlug);
  if (!product || product.studioSlug !== studioSlug) notFound();

  const category = getCategoryById(product.category);

  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: studio.name, href: `/studio/${studioSlug}` },
    { label: category?.nameKo ?? product.category, href: `/studio/${studioSlug}/category/${product.category}` },
    { label: product.title },
  ];

  const lowestPrice = SIZE_OPTIONS[0].printPrice;
  const highestPrice = SIZE_OPTIONS[SIZE_OPTIONS.length - 1].printPrice + SIZE_OPTIONS[SIZE_OPTIONS.length - 1].frameAddon;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.descriptionKo,
    image: `${SITE_URL}${product.image}`,
    brand: { '@type': 'Brand', name: studio.name },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'KRW',
      lowPrice: lowestPrice,
      highPrice: highestPrice,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'SILVERTAPE' },
    },
    category: category?.nameKo,
    sku: product.id,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumb items={breadcrumbItems} />
      <ProductDetailClient product={product} />
      <RelatedProducts currentProduct={product} studioSlug={studioSlug} />
    </main>
  );
}
