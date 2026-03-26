import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, cn, getMonthName } from '@/lib/utils';
import type { Budget } from '@/lib/types';

interface BudgetSummaryProps {
  budgets: Budget[];
  month: number;
  year: number;
}

export function BudgetSummary({ budgets, month, year }: BudgetSummaryProps) {
  const overBudget = budgets.filter(b => (b.percentage ?? 0) >= 100);
  const nearLimit = budgets.filter(b => (b.percentage ?? 0) >= 80 && (b.percentage ?? 0) < 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Orçamentos</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{getMonthName(month)}</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/budgets" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todos <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            <p>Nenhum orçamento definido.</p>
            <Button asChild className="mt-3" size="sm" variant="outline">
              <Link href="/dashboard/budgets">Criar orçamento</Link>
            </Button>
          </div>
        ) : (
          <>
            {(overBudget.length > 0 || nearLimit.length > 0) && (
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                overBudget.length > 0
                  ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              )}>
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {overBudget.length > 0
                  ? `${overBudget.length} orçamento(s) estourado(s)!`
                  : `${nearLimit.length} orçamento(s) próximo(s) do limite`
                }
              </div>
            )}
            {budgets.slice(0, 5).map((budget) => (
              <BudgetItem key={budget.id} budget={budget} />
            ))}
            {budgets.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{budgets.length - 5} orçamentos
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetItem({ budget }: { budget: Budget }) {
  const percentage = budget.percentage ?? 0;
  const isOver = percentage >= 100;
  const isNear = percentage >= 80 && !isOver;

  const progressColor = isOver
    ? 'bg-red-500'
    : isNear
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: budget.category?.color ?? '#6366f1' }}
          />
          <span className="text-sm font-medium truncate max-w-[110px]">
            {budget.category?.name ?? 'Categoria'}
          </span>
        </div>
        <span className={cn(
          'text-xs font-semibold',
          isOver ? 'text-red-600 dark:text-red-400' : isNear ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
        )}>
          {percentage}%
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full transition-all', progressColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(budget.spent ?? 0)}</span>
        <span>{formatCurrency(budget.amount)}</span>
      </div>
    </div>
  );
}
