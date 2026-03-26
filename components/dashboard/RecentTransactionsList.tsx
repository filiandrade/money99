import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

interface RecentTransactionsListProps {
  transactions: Transaction[];
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimas Transações</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/transactions" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm px-6">
            <p>Nenhuma transação registrada ainda.</p>
            <Button asChild className="mt-3" size="sm">
              <Link href="/dashboard/transactions/new">Criar primeira transação</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isReceita = transaction.type === 'receita';
  const isDespesa = transaction.type === 'despesa';
  const isTransferencia = transaction.type === 'transferencia';

  const Icon = isReceita ? ArrowUpRight : isDespesa ? ArrowDownLeft : ArrowLeftRight;
  const iconBg = isReceita
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
    : isDespesa
    ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
    : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400';

  const amountColor = isReceita
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDespesa
    ? 'text-red-600 dark:text-red-400'
    : 'text-blue-600 dark:text-blue-400';

  const prefix = isReceita ? '+' : isDespesa ? '-' : '↔';

  return (
    <div className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
      <div className={cn('p-2 rounded-lg flex-shrink-0', iconBg)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatDate(transaction.date)}
          </span>
          {transaction.category && (
            <Badge
              variant="outline"
              className="text-xs py-0 px-1.5 h-4"
              style={{ borderColor: transaction.category.color + '40', color: transaction.category.color }}
            >
              {transaction.category.name}
            </Badge>
          )}
        </div>
      </div>
      <p className={cn('text-sm font-semibold flex-shrink-0', amountColor)}>
        {prefix} {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}
