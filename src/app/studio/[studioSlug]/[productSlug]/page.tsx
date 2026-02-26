import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import { getProductBySlug, getProductsByStudio } from '@/data/products';
import { getStudioBySlug, STUDIOS } from '@/data/studios';
import { getCategoryById } from '@/data/categories';

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
  const { productSlug } = await params;
  const product = getProductBySlug(productSlug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title} — ${product.titleKo}`,
    description: product.descriptionKo,
    openGraph: {
      title: `${product.title} | SILVERTAPE`,
      description: product.descriptionKo,
      images: [{ url: product.image }],
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

  return (
    <main>
      <Breadcrumb items={breadcrumbItems} />
      <ProductDetailClient product={product} />
      <RelatedProducts currentProduct={product} studioSlug={studioSlug} />
    </main>
  );
}
