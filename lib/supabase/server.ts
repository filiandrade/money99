import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente do Supabase para uso no lado do servidor (Server Components, Server Actions, Route Handlers)
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies não podem ser modificados aqui
            // mas o middleware cuida da atualização da sessão
          }
        },
      },
    }
  );
}
