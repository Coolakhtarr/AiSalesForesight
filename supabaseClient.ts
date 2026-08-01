import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Usage in a client component:
//   const supabase = createClient();
//   const { data: { session } } = await supabase.auth.getSession();
//   const { data } = await supabase.from("products").select("*"); // RLS-scoped automatically
