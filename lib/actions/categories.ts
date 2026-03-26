'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

// Buscar todas as categorias do usuário
export async function getCategories(type?: 'receita' | 'despesa' | 'ambos') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  let query = supabase
    .from('categories')
    .select('*, subcategories(id, name)')
    .eq('user_id', user.id)
    .order('name');

  if (type) {
    query = query.or(`type.eq.${type},type.eq.ambos`);
  }

  const { data } = await query;
  return { data: data ?? [] };
}

// Criar categoria
export async function createCategory(formData: {
  name: string;
  type: string;
  color: string;
  icon: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: formData.name,
    type: formData.type,
    color: formData.color,
    icon: formData.icon,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/transactions');
  return { success: true };
}

// Atualizar categoria
export async function updateCategory(
  id: string,
  formData: Partial<{ name: string; type: string; color: string; icon: string }>
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('categories')
    .update(formData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Excluir categoria
export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_default', false); // Não permite excluir categorias padrão

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Criar subcategoria
export async function createSubcategory(formData: {
  category_id: string;
  name: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase.from('subcategories').insert({
    user_id: user.id,
    category_id: formData.category_id,
    name: formData.name,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Excluir subcategoria
export async function deleteSubcategory(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('subcategories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/settings');
  return { success: true };
}
