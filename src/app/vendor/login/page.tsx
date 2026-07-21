import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isVendorAuthConfigured, isVendorAuthenticated } from '@/lib/admin-auth';
import styles from './login.module.css';

interface VendorLoginPageProps {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Invalid 4-digit PIN.',
  config: 'Vendor auth is not configured on the server.',
  session: 'Failed to create session.',
};

export const dynamic = 'force-dynamic';

export default async function VendorLoginPage({ searchParams }: VendorLoginPageProps) {
  if (await isVendorAuthenticated()) {
    redirect('/rachel');
  }

  const params = await searchParams;
  const error = params.error && ERROR_MESSAGES[params.error] ? ERROR_MESSAGES[params.error] : null;
  const redirectTo = params.redirectTo && params.redirectTo.startsWith('/rachel')
    ? params.redirectTo
    : '/rachel';
  const configured = isVendorAuthConfigured();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>RACHEL FLOWER</p>
        <h1 className={styles.title}>Production and Shipping Login</h1>
        <p className={styles.subtitle}>
          Sign in with a 4-digit PIN to check and process orders from any device.
        </p>

        {!configured && (
          <p className={styles.error}>
            `VENDOR_DASHBOARD_PIN` (4 digits) and `ADMIN_SESSION_SECRET` must be set.
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}

        <form method="post" action="/api/admin/auth/login" className={styles.form}>
          <input type="hidden" name="role" value="vendor" />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className={styles.label}>
            4-digit PIN
            <input
              className={styles.input}
              name="password"
              type="password"
              required
              autoComplete="current-password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="0000"
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
