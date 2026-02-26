import { redirect } from 'next/navigation';
import { CATEGORIES } from '@/data/categories';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.id }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  redirect(`/studio/hangover/category/${category}`);
}
