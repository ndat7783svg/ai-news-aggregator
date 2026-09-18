import { createClient } from "@supabase/supabase-js";

function cleanSecret(raw, name) {
  if (!raw) return "";
  return raw
    .trim()
    .replace(new RegExp("^" + name + "\\s*=\\s*", "i"), "")
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "")
    .trim();
}

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabaseUrl = cleanSecret(rawUrl, "SUPABASE_URL");
const supabaseAnonKey = cleanSecret(rawKey, "SUPABASE_ANON_KEY");

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
