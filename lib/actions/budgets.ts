'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

// Buscar orçamentos de um mês específico, com valor gasto calculado
export async function getBudgets(month: number, year: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  // Buscar orçamentos
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, color, icon)')
    .eq('user_id', user.id)
    .eq('month', month)
    .eq('year', year);

  if (!budgets || budgets.length === 0) return { data: [] };

  // Buscar gastos por categoria no mês
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const categoryIds = budgets.map(b => b.category_id);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', user.id)
    .eq('type', 'despesa')
    .in('category_id', categoryIds)
    .gte('date', startDate)
    .lte('date', endDate);

  // Calcular gasto por categoria
  const spentByCategory: Record<string, number> = {};
  transactions?.forEach(t => {
    if (!spentByCategory[t.category_id]) spentByCategory[t.category_id] = 0;
    spentByCategory[t.category_id] += Number(t.amount);
  });

  // Combinar orçamentos com gastos
  const enrichedBudgets = budgets.map(budget => {
    const spent = spentByCategory[budget.category_id] ?? 0;
    const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
    return {
      ...budget,
      amount: Number(budget.amount),
      spent,
      remaining: Math.max(0, Number(budget.amount) - spent),
      percentage,
    };
  });

  return { data: enrichedBudgets };
}

// Criar orçamento
export async function createBudget(formData: {
  category_id: string;
  amount: number;
  month: number;
  year: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase.from('budgets').upsert({
    user_id: user.id,
    category_id: formData.category_id,
    amount: formData.amount,
    month: formData.month,
    year: formData.year,
  }, {
    onConflict: 'user_id,category_id,month,year',
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/budgets');
  return { success: true };
}

// Atualizar orçamento
export async function updateBudget(id: string, amount: number): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('budgets')
    .update({ amount })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/budgets');
  return { success: true };
}

// Excluir orçamento
export async function deleteBudget(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/budgets');
  return { success: true };
}
