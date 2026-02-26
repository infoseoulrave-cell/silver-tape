import HeroCarousel from '@/components/home/HeroCarousel';
import ProductShowcase from '@/components/home/ProductShowcase';
import CategoryMasonry from '@/components/home/CategoryMasonry';
import GalleryStrip from '@/components/home/GalleryStrip';
import BrandManifesto from '@/components/home/BrandManifesto';
import Newsletter from '@/components/home/Newsletter';

export default function Home() {
  return (
    <main>
      <HeroCarousel />
      <ProductShowcase />
      <CategoryMasonry />
      <GalleryStrip />
      <BrandManifesto />
      <Newsletter />
    </main>
  );
}
