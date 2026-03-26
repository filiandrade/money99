import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Handler do callback OAuth do Supabase (Google, etc.)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirecionar para login com mensagem de erro em caso de falha
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
