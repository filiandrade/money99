'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, TransactionFilters } from '@/lib/types';

// Buscar todas as transações com filtros opcionais
export async function getTransactions(filters?: TransactionFilters) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Não autenticado' };

  let query = supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(id, name, type, color, icon),
      destination_account:accounts!transactions_destination_account_id_fkey(id, name, type, color, icon),
      category:categories(id, name, color, icon),
      subcategory:subcategories(id, name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters?.month && filters?.year) {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
    const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  } else if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom);
  } else if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo);
  }

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters?.account_id) {
    query = query.eq('account_id', filters.account_id);
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.search) {
    query = query.ilike('description', `%${filters.search}%`);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message };
}

// Buscar transações recentes (para o dashboard)
export async function getRecentTransactions(limit = 8) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(id, name, type, color, icon),
      category:categories(id, name, color, icon)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [] };
}

// Criar nova transação
export async function createTransaction(
  formData: {
    type: string;
    amount: number;
    description: string;
    notes?: string;
    date: string;
    category_id?: string;
    subcategory_id?: string;
    account_id?: string;
    destination_account_id?: string;
    is_recurring?: boolean;
    recurring_frequency?: string;
    tags?: string[];
  }
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: formData.type,
      amount: formData.amount,
      description: formData.description,
      notes: formData.notes || null,
      date: formData.date,
      category_id: formData.category_id || null,
      subcategory_id: formData.subcategory_id || null,
      account_id: formData.account_id || null,
      destination_account_id: formData.destination_account_id || null,
      is_recurring: formData.is_recurring ?? false,
      recurring_frequency: formData.recurring_frequency || null,
      tags: formData.tags || null,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  revalidatePath('/dashboard/accounts');
  revalidatePath('/dashboard/budgets');
  revalidatePath('/dashboard/reports');
  return { success: true };
}

// Atualizar transação existente
export async function updateTransaction(
  id: string,
  formData: Partial<{
    type: string;
    amount: number;
    description: string;
    notes: string;
    date: string;
    category_id: string;
    subcategory_id: string;
    account_id: string;
    destination_account_id: string;
    is_recurring: boolean;
    recurring_frequency: string;
    tags: string[];
  }>
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('transactions')
    .update(formData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  revalidatePath('/dashboard/accounts');
  revalidatePath('/dashboard/budgets');
  return { success: true };
}

// Excluir transação
export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  revalidatePath('/dashboard/accounts');
  revalidatePath('/dashboard/budgets');
  return { success: true };
}

// Resumo do mês atual (para dashboard)
export async function getMonthSummary(month: number, year: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { receitas: 0, despesas: 0 };

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .in('type', ['receita', 'despesa']);

  const receitas = data?.filter(t => t.type === 'receita').reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const despesas = data?.filter(t => t.type === 'despesa').reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return { receitas, despesas };
}

// Evolução mensal dos últimos 6 meses
export async function getMonthlyEvolution() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const startDate = sixMonthsAgo.toISOString().split('T')[0];

  const { data } = await supabase
    .from('transactions')
    .select('type, amount, date')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .in('type', ['receita', 'despesa'])
    .order('date');

  // Agrupar por mês
  const grouped: Record<string, { receitas: number; despesas: number }> = {};
  data?.forEach((t) => {
    const key = t.date.substring(0, 7); // "YYYY-MM"
    if (!grouped[key]) grouped[key] = { receitas: 0, despesas: 0 };
    if (t.type === 'receita') grouped[key].receitas += Number(t.amount);
    else grouped[key].despesas += Number(t.amount);
  });

  return Object.entries(grouped).map(([key, values]) => ({
    month: key,
    receitas: values.receitas,
    despesas: values.despesas,
    saldo: values.receitas - values.despesas,
  }));
}

// Gastos por categoria no mês atual
export async function getCategoryExpenses(month: number, year: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data } = await supabase
    .from('transactions')
    .select('amount, category:categories(id, name, color)')
    .eq('user_id', user.id)
    .eq('type', 'despesa')
    .gte('date', startDate)
    .lte('date', endDate)
    .not('category_id', 'is', null);

  // Agrupar por categoria
  const grouped: Record<string, { name: string; value: number; color: string }> = {};
  data?.forEach((t: { amount: number; category: { id: string; name: string; color: string } | null }) => {
    const cat = t.category;
    if (!cat) return;
    if (!grouped[cat.id]) grouped[cat.id] = { name: cat.name, value: 0, color: cat.color };
    grouped[cat.id].value += Number(t.amount);
  });

  const total = Object.values(grouped).reduce((sum, c) => sum + c.value, 0);
  return Object.values(grouped)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map(cat => ({
      ...cat,
      percentage: total > 0 ? Math.round((cat.value / total) * 100) : 0,
    }));
}
