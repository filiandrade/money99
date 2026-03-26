'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

// Buscar todas as contas do usuário
export async function getAccounts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  return { data: data ?? [] };
}

// Criar nova conta
export async function createAccount(formData: {
  name: string;
  type: string;
  balance: number;
  color: string;
  icon: string;
  bank_name?: string;
  last_four_digits?: string;
  credit_limit?: number;
  due_day?: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: formData.name,
    type: formData.type,
    balance: formData.balance,
    color: formData.color,
    icon: formData.icon,
    bank_name: formData.bank_name || null,
    last_four_digits: formData.last_four_digits || null,
    credit_limit: formData.credit_limit || null,
    due_day: formData.due_day || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { success: true };
}

// Atualizar conta
export async function updateAccount(
  id: string,
  formData: Partial<{
    name: string;
    type: string;
    balance: number;
    color: string;
    icon: string;
    bank_name: string;
    last_four_digits: string;
    credit_limit: number;
    due_day: number;
  }>
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('accounts')
    .update(formData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { success: true };
}

// Excluir conta (desativar, não deletar)
export async function deleteAccount(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { success: true };
}

// Saldo total de todas as contas
export async function getTotalBalance() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .not('type', 'eq', 'cartao_credito'); // Não somar cartão de crédito no patrimônio

  return data?.reduce((sum, acc) => sum + Number(acc.balance), 0) ?? 0;
}
