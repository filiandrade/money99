'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getBudgets, createBudget, deleteBudget } from '@/lib/actions/budgets';
import { getCategories } from '@/lib/actions/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatMonthYear, cn } from '@/lib/utils';
import type { Budget, Category } from '@/lib/types';
import { Loader2, Trash2, PieChart } from 'lucide-react';

export function BudgetsContent() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [budgetResult, catResult] = await Promise.all([
      getBudgets(month, year),
      getCategories('despesa'),
    ]);
    setBudgets(budgetResult.data as Budget[]);
    setCategories(catResult.data as Category[]);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleCreate = async () => {
    if (!newCategoryId || newAmount <= 0) {
      toast.error('Selecione uma categoria e informe o valor.');
      return;
    }
    setIsSaving(true);
    const result = await createBudget({ category_id: newCategoryId, amount: newAmount, month, year });
    setIsSaving(false);
    if (result.success) {
      toast.success('Orçamento salvo!');
      setDialogOpen(false);
      setNewCategoryId('');
      setNewAmount(0);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar orçamento.');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteBudget(id);
    if (result.success) {
      toast.success('Orçamento removido.');
      loadData();
    } else {
      toast.error('Erro ao remover orçamento.');
    }
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent ?? 0), 0);
  const overBudgetCount = budgets.filter(b => (b.percentage ?? 0) >= 100).length;

  // Categorias sem orçamento no mês
  const categoriesWithoutBudget = categories.filter(
    cat => !budgets.some(b => b.category_id === cat.id)
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho com navegação de mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">
            Controle seus gastos por categoria
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center">
              {formatMonthYear(month, year)}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={categoriesWithoutBudget.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Resumo */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Orçado</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalBudgeted)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Gasto</p>
              <p className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Restante</p>
              <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {formatCurrency(Math.max(0, totalBudgeted - totalSpent))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerta de estouro */}
      {overBudgetCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-800 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            {overBudgetCount} orçamento(s) estourado(s) este mês! Revise seus gastos.
          </p>
        </div>
      )}

      {/* Lista de orçamentos */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-xl p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Nenhum orçamento para este mês"
          description="Defina um valor máximo para cada categoria de gasto e acompanhe seus limites."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro orçamento
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onDelete={() => handleDelete(budget.id)} />
          ))}
        </div>
      )}

      {/* Dialog novo orçamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Orçamento — {formatMonthYear(month, year)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria de despesa" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesWithoutBudget.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor máximo mensal</Label>
              <CurrencyInput value={newAmount} onChange={setNewAmount} placeholder="0,00" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSaving} className="flex-1">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetCard({ budget, onDelete }: { budget: Budget; onDelete: () => void }) {
  const percentage = budget.percentage ?? 0;
  const isOver = percentage >= 100;
  const isNear = percentage >= 80 && !isOver;

  const progressColor = isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';
  const progressBg = isOver ? 'bg-red-100 dark:bg-red-950' : isNear ? 'bg-amber-100 dark:bg-amber-950' : 'bg-secondary';

  return (
    <Card className={cn('transition-shadow hover:shadow-md', isOver && 'border-red-200 dark:border-red-800')}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: budget.category?.color ?? '#6366f1' }}
            />
            <span className="font-semibold">{budget.category?.name ?? 'Categoria'}</span>
            {isOver && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">
                Estourado!
              </span>
            )}
            {isNear && !isOver && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                Atenção
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={cn(
              'text-sm font-bold',
              isOver ? 'text-red-600 dark:text-red-400' : isNear ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
            )}>
              {percentage}%
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover orçamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O orçamento de "{budget.category?.name}" será removido deste mês.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className={cn('relative h-2.5 w-full overflow-hidden rounded-full', progressBg)}>
          <div
            className={cn('h-full transition-all duration-500', progressColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Valores */}
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Gasto</p>
            <p className={cn('font-semibold', isOver && 'text-red-600 dark:text-red-400')}>
              {formatCurrency(budget.spent ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Orçado</p>
            <p className="font-semibold">{formatCurrency(budget.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Restante</p>
            <p className={cn('font-semibold', isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
              {isOver ? '-' : ''}{formatCurrency(budget.remaining ?? 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
