'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Landmark, CreditCard, TrendingUp, PiggyBank, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { getAccounts, deleteAccount } from '@/lib/actions/accounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AccountDialog } from '@/components/accounts/AccountDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, cn } from '@/lib/utils';
import { ACCOUNT_TYPE_LABELS } from '@/lib/types';
import type { Account } from '@/lib/types';

const accountIcons: Record<string, React.ElementType> = {
  corrente: Landmark,
  poupanca: PiggyBank,
  cartao_credito: CreditCard,
  investimento: TrendingUp,
  dinheiro: Wallet,
  outro: Wallet,
};

export function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    const result = await getAccounts();
    setAccounts(result.data as Account[]);
    setIsLoading(false);
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleDelete = async (id: string) => {
    const result = await deleteAccount(id);
    if (result.success) {
      toast.success('Conta removida com sucesso!');
      loadAccounts();
    } else {
      toast.error('Erro ao remover conta.');
    }
  };

  const totalBalance = accounts
    .filter(a => a.type !== 'cartao_credito')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground text-sm">
            Patrimônio total: <span className="font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <Button onClick={() => { setEditingAccount(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Grid de contas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-xl p-5 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-40" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          description="Adicione suas contas bancárias, cartões e investimentos para controlar seu patrimônio."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeira conta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => { setEditingAccount(account); setDialogOpen(true); }}
              onDelete={() => handleDelete(account.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <AccountDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingAccount(null); }}
        account={editingAccount ?? undefined}
        onSuccess={() => { setDialogOpen(false); loadAccounts(); }}
      />
    </div>
  );
}

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountIcons[account.type] ?? Wallet;
  const isNegative = account.balance < 0;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: account.color + '20' }}
          >
            <Icon className="h-5 w-5" style={{ color: account.color }} />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <AlertDialogTitle>Remover conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A conta "{account.name}" será desativada. As transações vinculadas não serão afetadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div>
          <p className="font-semibold">{account.name}</p>
          {account.bank_name && (
            <p className="text-xs text-muted-foreground">{account.bank_name}</p>
          )}
          {account.last_four_digits && (
            <p className="text-xs text-muted-foreground">•••• {account.last_four_digits}</p>
          )}
        </div>

        <div className="mt-4">
          <p className={cn('text-2xl font-bold', isNegative && 'text-red-500')}>
            {formatCurrency(account.balance)}
          </p>
          {account.type === 'cartao_credito' && account.credit_limit && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Limite: {formatCurrency(account.credit_limit)}
            </p>
          )}
        </div>

        <div className="mt-3">
          <Badge variant="outline" className="text-xs">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
