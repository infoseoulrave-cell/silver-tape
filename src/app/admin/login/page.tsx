import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated, isAdminAuthConfigured } from '@/lib/admin-auth';
import styles from './login.module.css';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Invalid password.',
  config: 'Admin auth is not configured on the server.',
  session: 'Failed to create session.',
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect('/admin');
  }

  const params = await searchParams;
  const error = params.error && ERROR_MESSAGES[params.error] ? ERROR_MESSAGES[params.error] : null;
  const redirectTo = params.redirectTo && params.redirectTo.startsWith('/admin')
    ? params.redirectTo
    : '/admin';
  const configured = isAdminAuthConfigured();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>ADMIN</p>
        <h1 className={styles.title}>Dashboard Sign In</h1>
        <p className={styles.subtitle}>
          Use the admin password to access orders, visitors, and product tools.
        </p>

        {!configured && (
          <p className={styles.error}>
            `ADMIN_DASHBOARD_PASSWORD` and `ADMIN_SESSION_SECRET` must be set.
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}

        <form method="post" action="/api/admin/auth/login" className={styles.form}>
          <input type="hidden" name="role" value="admin" />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter admin password"
            />
          </label>
          <button className={styles.button} type="submit" disabled={!configured}>
            Sign In
          </button>
        </form>

        <Link className={styles.back} href="/">
          Back to site
        </Link>
      </section>
    </main>
  );
}
