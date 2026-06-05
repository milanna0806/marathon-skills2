import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// For API routes (server-side): use service role key to bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// For client-side: use anon key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin client with service role (bypasses RLS) — use only in API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Public client — use on client side
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
