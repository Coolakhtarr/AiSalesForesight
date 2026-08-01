import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used inside Server Components / Route Handlers. Reads the user's session
// from cookies so all queries remain RLS-scoped to their organization —
// this client never bypasses RLS (unlike the FastAPI service role client).
export function createServerClient() {
  const cookieStore = cookies();

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
