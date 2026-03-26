import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { getRecentTransactions, getMonthSummary, getMonthlyEvolution, getCategoryExpenses } from '@/lib/actions/transactions';
import { getTotalBalance } from '@/lib/actions/accounts';
import { getBudgets } from '@/lib/actions/budgets';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { BudgetSummary } from '@/components/dashboard/BudgetSummary';

interface DashboardContentProps {
  userId: string;
}

export async function DashboardContent({ userId }: DashboardContentProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Buscar todos os dados em paralelo
  const [
    totalBalance,
    monthSummary,
    recentTransactions,
    monthlyEvolution,
    categoryExpenses,
    budgets,
  ] = await Promise.all([
    getTotalBalance(),
    getMonthSummary(currentMonth, currentYear),
    getRecentTransactions(8),
    getMonthlyEvolution(),
    getCategoryExpenses(currentMonth, currentYear),
    getBudgets(currentMonth, currentYear),
  ]);

  const monthBalance = monthSummary.receitas - monthSummary.despesas;
  const monthName = getMonthName(currentMonth);

  return (
    <div className="space-y-6 animate-in-up">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, bom dia! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/dashboard/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Link>
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          description="Todas as contas"
          trend={totalBalance >= 0 ? 'positive' : 'negative'}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50 dark:bg-indigo-950"
        />
        <SummaryCard
          title="Receitas do Mês"
          value={formatCurrency(monthSummary.receitas)}
          icon={TrendingUp}
          description={monthName}
          trend="positive"
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
        />
        <SummaryCard
          title="Despesas do Mês"
          value={formatCurrency(monthSummary.despesas)}
          icon={TrendingDown}
          description={monthName}
          trend="negative"
          iconColor="text-red-500"
          iconBg="bg-red-50 dark:bg-red-950"
        />
        <SummaryCard
          title="Saldo do Mês"
          value={formatCurrency(monthBalance)}
          icon={ArrowLeftRight}
          description={`Balanço de ${monthName}`}
          trend={monthBalance >= 0 ? 'positive' : 'negative'}
          iconColor={monthBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}
          iconBg={monthBalance >= 0 ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EvolutionChart data={monthlyEvolution} />
        </div>
        <div>
          <CategoryPieChart data={categoryExpenses} />
        </div>
      </div>

      {/* Transações recentes + Orçamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentTransactionsList transactions={recentTransactions.data} />
        </div>
        <div>
          <BudgetSummary budgets={budgets.data} month={currentMonth} year={currentYear} />
        </div>
      </div>
    </div>
  );
}
