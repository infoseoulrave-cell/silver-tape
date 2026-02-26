import { redirect } from 'next/navigation';
import { getProductBySlug, getAllSlugs } from '@/data/products';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (product) {
    redirect(`/studio/${product.studioSlug}/${product.slug}`);
  }

  redirect('/');
}
