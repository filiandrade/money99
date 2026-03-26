import { SettingsContent } from '@/components/settings/SettingsContent';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Configurações' };

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  return <SettingsContent profile={profile} />;
}
