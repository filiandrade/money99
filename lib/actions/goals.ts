'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

// Buscar todas as metas
export async function getGoals() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const goals = data?.map(g => ({
    ...g,
    target_amount: Number(g.target_amount),
    current_amount: Number(g.current_amount),
    percentage: g.target_amount > 0
      ? Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100))
      : 0,
    remaining: Math.max(0, Number(g.target_amount) - Number(g.current_amount)),
  }));

  return { data: goals ?? [] };
}

// Criar meta
export async function createGoal(formData: {
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  color?: string;
  icon?: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase.from('goals').insert({
    user_id: user.id,
    name: formData.name,
    description: formData.description || null,
    target_amount: formData.target_amount,
    current_amount: formData.current_amount ?? 0,
    target_date: formData.target_date || null,
    color: formData.color ?? '#6366f1',
    icon: formData.icon ?? 'target',
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/goals');
  return { success: true };
}

// Atualizar meta
export async function updateGoal(
  id: string,
  formData: Partial<{
    name: string;
    description: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    color: string;
    icon: string;
    is_completed: boolean;
  }>
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // Verificar se foi concluída automaticamente
  if (formData.current_amount !== undefined && formData.target_amount !== undefined) {
    if (formData.current_amount >= formData.target_amount) {
      formData.is_completed = true;
    }
  }

  const { error } = await supabase
    .from('goals')
    .update(formData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/goals');
  return { success: true };
}

// Adicionar valor à meta
export async function addAmountToGoal(id: string, amount: number): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // Buscar meta atual
  const { data: goal } = await supabase
    .from('goals')
    .select('current_amount, target_amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!goal) return { success: false, error: 'Meta não encontrada' };

  const newAmount = Number(goal.current_amount) + amount;
  const isCompleted = newAmount >= Number(goal.target_amount);

  const { error } = await supabase
    .from('goals')
    .update({ current_amount: newAmount, is_completed: isCompleted })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/goals');
  return { success: true };
}

// Excluir meta
export async function deleteGoal(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/goals');
  return { success: true };
}
