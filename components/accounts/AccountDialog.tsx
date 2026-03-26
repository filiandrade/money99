'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createAccount, updateAccount } from '@/lib/actions/accounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/types';
import type { Account } from '@/lib/types';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['corrente', 'poupanca', 'cartao_credito', 'investimento', 'dinheiro', 'outro']),
  balance: z.number(),
  color: z.string(),
  icon: z.string(),
  bank_name: z.string().optional(),
  last_four_digits: z.string().max(4).optional(),
  credit_limit: z.number().optional(),
  due_day: z.number().min(1).max(31).optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSuccess?: () => void;
}

export function AccountDialog({ open, onOpenChange, account, onSuccess }: AccountDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: account?.type ?? 'corrente',
      balance: account?.balance ?? 0,
      color: account?.color ?? '#6366f1',
      icon: account?.icon ?? 'landmark',
      bank_name: account?.bank_name ?? '',
      last_four_digits: account?.last_four_digits ?? '',
      credit_limit: account?.credit_limit ?? 0,
      due_day: account?.due_day ?? undefined,
    },
  });

  const selectedType = watch('type');
  const isCreditCard = selectedType === 'cartao_credito';

  const onSubmit = async (data: AccountFormValues) => {
    const formData = {
      name: data.name,
      type: data.type,
      balance: data.balance,
      color: data.color,
      icon: data.icon,
      bank_name: data.bank_name || undefined,
      last_four_digits: data.last_four_digits || undefined,
      credit_limit: isCreditCard ? data.credit_limit : undefined,
      due_day: isCreditCard ? data.due_day : undefined,
    };

    let result;
    if (account) {
      result = await updateAccount(account.id, formData);
    } else {
      result = await createAccount(formData);
    }

    if (result.success) {
      toast.success(account ? 'Conta atualizada!' : 'Conta criada com sucesso!');
      onSuccess?.();
    } else {
      toast.error(result.error ?? 'Erro ao salvar conta.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input id="name" placeholder="Ex: Nubank, Bradesco, Carteira" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Saldo Inicial</Label>
              <Controller
                name="balance"
                control={control}
                render={({ field }) => (
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Banco</Label>
              <Input id="bank_name" placeholder="Ex: Nubank, Itaú" {...register('bank_name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_four_digits">Últimos 4 dígitos</Label>
              <Input id="last_four_digits" maxLength={4} placeholder="0000" {...register('last_four_digits')} />
            </div>

            {isCreditCard && (
              <>
                <div className="space-y-2">
                  <Label>Limite do Cartão</Label>
                  <Controller
                    name="credit_limit"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput value={field.value ?? 0} onChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_day">Dia de Vencimento</Label>
                  <Input
                    id="due_day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="15"
                    {...register('due_day', { valueAsNumber: true })}
                  />
                </div>
              </>
            )}

            {/* Cor */}
            <div className="col-span-2 space-y-2">
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
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                account ? 'Atualizar' : 'Criar Conta'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
