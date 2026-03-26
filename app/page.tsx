import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Rota raiz: redireciona para dashboard se autenticado, senão para login
export default async function RootPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
