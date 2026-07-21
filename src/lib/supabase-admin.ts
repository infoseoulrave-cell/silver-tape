import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Server-side client with service role key (bypasses RLS)
// Use this in API routes only — never import in client components
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
