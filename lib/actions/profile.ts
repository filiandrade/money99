'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

// Buscar perfil do usuário autenticado
export async function getProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

// Atualizar perfil
export async function updateProfile(formData: {
  full_name?: string;
  currency?: string;
  theme?: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('profiles')
    .update(formData)
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Exportar todos os dados do usuário
export async function exportUserData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [transactions, accounts, categories, budgets, goals] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id),
    supabase.from('accounts').select('*').eq('user_id', user.id),
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase.from('budgets').select('*').eq('user_id', user.id),
    supabase.from('goals').select('*').eq('user_id', user.id),
  ]);

  return {
    transactions: transactions.data ?? [],
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    budgets: budgets.data ?? [],
    goals: goals.data ?? [],
    exportedAt: new Date().toISOString(),
  };
}
