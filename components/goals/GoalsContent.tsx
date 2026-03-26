'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, Pencil, Trash2, Trophy, Plus as PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { getGoals, createGoal, updateGoal, deleteGoal, addAmountToGoal } from '@/lib/actions/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { DatePicker } from '@/components/common/DatePicker';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/types';
import type { Goal } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  target_amount: z.number().positive('Valor alvo deve ser maior que zero'),
  current_amount: z.number().min(0),
  target_date: z.date().optional(),
  color: z.string(),
  icon: z.string(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addAmountGoal, setAddAmountGoal] = useState<Goal | null>(null);
  const [addValue, setAddValue] = useState(0);
  const [isAddingAmount, setIsAddingAmount] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { color: '#6366f1', icon: 'target', current_amount: 0, target_amount: 0 },
  });

  const loadGoals = async () => {
    setIsLoading(true);
    const result = await getGoals();
    setGoals(result.data as Goal[]);
    setIsLoading(false);
  };

  useEffect(() => { loadGoals(); }, []);

  const openCreate = () => {
    setEditingGoal(null);
    reset({ color: '#6366f1', icon: 'target', current_amount: 0, target_amount: 0, name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    reset({
      name: goal.name,
      description: goal.description ?? '',
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date ? new Date(goal.target_date + 'T00:00:00') : undefined,
      color: goal.color,
      icon: goal.icon,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: GoalFormValues) => {
    const formData = {
      name: data.name,
      description: data.description,
      target_amount: data.target_amount,
      current_amount: data.current_amount,
      target_date: data.target_date ? format(data.target_date, 'yyyy-MM-dd') : undefined,
      color: data.color,
      icon: data.icon,
    };

    let result;
    if (editingGoal) {
      result = await updateGoal(editingGoal.id, formData);
    } else {
      result = await createGoal(formData);
    }

    if (result.success) {
      toast.success(editingGoal ? 'Meta atualizada!' : 'Meta criada com sucesso!');
      setDialogOpen(false);
      loadGoals();
    } else {
      toast.error(result.error ?? 'Erro ao salvar meta.');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteGoal(id);
    if (result.success) {
      toast.success('Meta removida.');
      loadGoals();
    } else {
      toast.error('Erro ao remover meta.');
    }
  };

  const handleAddAmount = async () => {
    if (!addAmountGoal || addValue <= 0) return;
    setIsAddingAmount(true);
    const result = await addAmountToGoal(addAmountGoal.id, addValue);
    setIsAddingAmount(false);
    if (result.success) {
      toast.success('Valor adicionado à meta!');
      setAddAmountGoal(null);
      setAddValue(0);
      loadGoals();
    } else {
      toast.error('Erro ao adicionar valor.');
    }
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas de Economia</h1>
          <p className="text-muted-foreground text-sm">
            {activeGoals.length} meta(s) ativa(s) · {completedGoals.length} concluída(s)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-xl p-5 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta criada"
          description="Defina objetivos financeiros como uma viagem, compra de carro ou fundo de emergência."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira meta
            </Button>
          }
        />
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => handleDelete(goal.id)}
                  onAddAmount={() => { setAddAmountGoal(goal); setAddValue(0); }}
                />
              ))}
            </div>
          )}
          {completedGoals.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Metas Concluídas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => openEdit(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onAddAmount={() => {}}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Dialog criar/editar meta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Meta *</Label>
              <Input placeholder="Ex: Viagem para Europa, Carro novo" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea placeholder="Descreva sua meta..." rows={2} {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Alvo *</Label>
                <Controller
                  name="target_amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.target_amount && <p className="text-xs text-destructive">{errors.target_amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Já guardei</Label>
                <Controller
                  name="current_amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Alvo (opcional)</Label>
              <Controller
                name="target_date"
                control={control}
                render={({ field }) => (
                  <DatePicker date={field.value} onSelect={field.onChange} placeholder="Selecionar data alvo" />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORY_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${field.value === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingGoal ? 'Atualizar' : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog adicionar valor */}
      <Dialog open={!!addAmountGoal} onOpenChange={(open) => !open && setAddAmountGoal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar à Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adicionando para: <strong>{addAmountGoal?.name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Valor a adicionar</Label>
              <CurrencyInput value={addValue} onChange={setAddValue} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddAmountGoal(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAddAmount} disabled={isAddingAmount || addValue <= 0} className="flex-1">
                {isAddingAmount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onAddAmount: () => void;
}

function GoalCard({ goal, onEdit, onDelete, onAddAmount }: GoalCardProps) {
  const percentage = goal.percentage ?? 0;
  const isCompleted = goal.is_completed;

  return (
    <Card className={cn(
      'group hover:shadow-md transition-shadow',
      isCompleted && 'opacity-75'
    )}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: goal.color }}
          >
            {isCompleted ? '🏆' : goal.name[0].toUpperCase()}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCompleted && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddAmount} title="Adicionar valor">
                <PlusIcon className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A meta "{goal.name}" será excluída permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">{goal.name}</h3>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>
          )}
          {goal.target_date && (
            <p className="text-xs text-muted-foreground mt-1">
              Prazo: {formatDate(goal.target_date, 'dd/MM/yyyy')}
            </p>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{formatCurrency(goal.current_amount)}</span>
            <span className="font-semibold" style={{ color: goal.color }}>{percentage}%</span>
            <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: goal.color,
              }}
            />
          </div>
          {!isCompleted && (
            <p className="text-xs text-muted-foreground text-right">
              Faltam {formatCurrency(goal.remaining ?? 0)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
