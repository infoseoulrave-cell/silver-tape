import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import { getProductBySlug, getAllSlugs } from '@/data/products';
import { getCategoryById } from '@/data/categories';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title} — ${product.titleKo}`,
    description: product.descriptionKo,
    openGraph: {
      title: `${product.title} | HANGOVER`,
      description: product.descriptionKo,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryById(product.category);

  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: category?.nameKo ?? product.category, href: `/category/${product.category}` },
    { label: product.title },
  ];

  return (
    <main>
      <Breadcrumb items={breadcrumbItems} />
      <ProductDetailClient product={product} />
      <RelatedProducts currentProduct={product} />
    </main>
  );
}
