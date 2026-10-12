/**
 * Supabase service-role client.
 *
 * Used ONLY by trusted server-side code that must bypass Row Level Security.
 * The service-role key is NEVER exposed to the browser or included in any
 * client bundle. It is loaded exclusively from the SUPABASE_SERVICE_ROLE_KEY
 * environment variable on the server.
 *
 * Current uses:
 *   - Razorpay payment verification (updates payment_status after HMAC verification)
 *   - Razorpay order creation (stores razorpay_order_id before payment)
 *
 * Do not import this in client components, server components that render to
 * the browser, or any code that runs outside a trusted server context.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase service-role environment variables. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
  );
}

export function createSupabaseServiceClient() {
  return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}