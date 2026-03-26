'use client';

import { useState } from 'react';
import { Pencil, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { deleteTransaction } from '@/lib/actions/transactions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TransactionDialog } from '@/components/transactions/TransactionDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { Receipt } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TransactionTable({ transactions, isLoading, onRefresh }: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteTransaction(id);
    setDeletingId(null);
    if (result.success) {
      toast.success('Transação excluída com sucesso!');
      onRefresh();
    } else {
      toast.error('Erro ao excluir transação.');
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Ações'].map(h => (
                <TableHead key={h}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma transação encontrada"
        description="Ajuste os filtros ou crie sua primeira transação."
      />
    );
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="hidden lg:table-cell">Conta</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onEdit={() => setEditingTransaction(transaction)}
                onDelete={() => handleDelete(transaction.id)}
                isDeleting={deletingId === transaction.id}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edição */}
      {editingTransaction && (
        <TransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          transaction={editingTransaction}
          onSuccess={() => {
            setEditingTransaction(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function TransactionRow({ transaction, onEdit, onDelete, isDeleting }: TransactionRowProps) {
  const isReceita = transaction.type === 'receita';
  const isDespesa = transaction.type === 'despesa';

  const TypeIcon = isReceita ? ArrowUpRight : isDespesa ? ArrowDownLeft : ArrowLeftRight;
  const typeBadgeVariant = isReceita ? 'success' : isDespesa ? 'destructive' : 'secondary';
  const typeLabel = isReceita ? 'Receita' : isDespesa ? 'Despesa' : 'Transferência';
  const amountColor = isReceita
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDespesa
    ? 'text-red-600 dark:text-red-400'
    : 'text-blue-600 dark:text-blue-400';
  const prefix = isReceita ? '+' : isDespesa ? '-' : '↔';

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-sm">{formatDate(transaction.date)}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{transaction.description}</span>
          {transaction.notes && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{transaction.notes}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {transaction.category ? (
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: transaction.category.color + '50', color: transaction.category.color }}
          >
            {transaction.category.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="text-sm text-muted-foreground">
          {transaction.account?.name ?? '—'}
        </span>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={typeBadgeVariant as 'success' | 'destructive' | 'secondary'} className="text-xs">
          <TypeIcon className="mr-1 h-3 w-3" />
          {typeLabel}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <span className={cn('font-semibold text-sm', amountColor)}>
          {prefix} {formatCurrency(transaction.amount)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
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
                <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá excluir permanentemente a transação <strong>"{transaction.description}"</strong> e reverter o saldo da conta. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
