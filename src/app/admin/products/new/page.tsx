import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { listCategoryOptions, listFloristOptions } from '@/lib/admin-data';
import styles from './product-new.module.css';

interface NewProductPageProps {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?redirectTo=/admin/products/new');
  }

  const params = await searchParams;
  const [categories, florists] = await Promise.all([
    listCategoryOptions(),
    listFloristOptions(),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.badge}>ADMIN</p>
          <h1 className={styles.title}>Register New Product</h1>
          <p className={styles.subtitle}>
            This form inserts data into `Product` table (or `admin_products` fallback).
          </p>
        </div>
        <Link href="/admin" className={styles.backBtn}>
          Back to Dashboard
        </Link>
      </header>

      {params.created && (
        <p className={styles.success}>Created product: {params.created}</p>
      )}
      {params.error && (
        <p className={styles.error}>Failed: {params.error}</p>
      )}

      <form method="post" action="/api/admin/products" className={styles.form}>
        <div className={styles.grid2}>
          <label className={styles.field}>
            Name (KR/Display)
            <input name="name" required placeholder="Proud Love" />
          </label>
          <label className={styles.field}>
            Name (EN)
            <input name="nameEn" placeholder="Proud Love" />
          </label>
        </div>

        <div className={styles.grid3}>
          <label className={styles.field}>
            Slug
            <input name="slug" placeholder="proud-love" />
          </label>
          <label className={styles.field}>
            Price
            <input type="number" min="1000" step="1000" name="price" required placeholder="120000" />
          </label>
          <label className={styles.field}>
            Original Price
            <input type="number" min="1000" step="1000" name="originalPrice" placeholder="150000" />
          </label>
        </div>

        <div className={styles.grid2}>
          {categories.length > 0 ? (
            <label className={styles.field}>
              Category
              <select name="categoryId" required defaultValue="">
                <option value="" disabled>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.slug ?? category.id})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={styles.field}>
              Category ID
              <input name="categoryId" required placeholder="category id" />
            </label>
          )}

          {florists.length > 0 ? (
            <label className={styles.field}>
              Florist (optional)
              <select name="floristId" defaultValue="">
                <option value="">None</option>
                {florists.map((florist) => (
                  <option key={florist.id} value={florist.id}>
                    {florist.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={styles.field}>
              Florist ID (optional)
              <input name="floristId" placeholder="florist id" />
            </label>
          )}
        </div>

        <label className={styles.field}>
          Primary Image URL
          <input name="imageUrl" placeholder="https://..." />
        </label>

        <label className={styles.field}>
          Sizes (comma/newline separated)
          <textarea
            name="sizes"
            rows={3}
            required
            defaultValue={'Base 120,000 KRW~\nVolume 190,000 KRW~\nLuxury 280,000 KRW~'}
          />
        </label>

        <label className={styles.field}>
          Description
          <textarea name="description" rows={3} required />
        </label>

        <label className={styles.field}>
          Details
          <textarea name="details" rows={5} required />
        </label>

        <div className={styles.grid3}>
          <label className={styles.field}>
            Tags (comma/newline)
            <textarea name="tags" rows={2} placeholder="spring, gift" />
          </label>
          <label className={styles.field}>
            Collections (comma/newline)
            <textarea name="collections" rows={2} placeholder="best, anniversary" />
          </label>
          <label className={styles.field}>
            Occasions (comma/newline)
            <textarea name="occasions" rows={2} placeholder="birthday, opening" />
          </label>
        </div>

        <div className={styles.checkRow}>
          <label><input type="checkbox" name="inStock" defaultChecked /> In Stock</label>
          <label><input type="checkbox" name="isNew" defaultChecked /> New</label>
          <label><input type="checkbox" name="isBest" /> Best</label>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Create Product
        </button>
      </form>
    </main>
  );
}
