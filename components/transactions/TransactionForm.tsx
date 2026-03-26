'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createTransaction, updateTransaction } from '@/lib/actions/transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/common/DatePicker';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Transaction, Account, Category } from '@/lib/types';

const transactionSchema = z.object({
  type: z.enum(['receita', 'despesa', 'transferencia']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  notes: z.string().max(1000).optional(),
  date: z.date(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  account_id: z.string().optional(),
  destination_account_id: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['diario', 'semanal', 'mensal', 'anual']).optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? 'despesa',
      amount: transaction?.amount ?? 0,
      description: transaction?.description ?? '',
      notes: transaction?.notes ?? '',
      date: transaction?.date ? new Date(transaction.date + 'T00:00:00') : new Date(),
      category_id: transaction?.category_id ?? undefined,
      subcategory_id: transaction?.subcategory_id ?? undefined,
      account_id: transaction?.account_id ?? undefined,
      destination_account_id: transaction?.destination_account_id ?? undefined,
      is_recurring: transaction?.is_recurring ?? false,
      recurring_frequency: transaction?.recurring_frequency ?? undefined,
    },
  });

  const type = watch('type');
  const isRecurring = watch('is_recurring');
  const selectedCategoryId = watch('category_id');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  // Filtrar categorias pelo tipo
  const filteredCategories = categories.filter(c =>
    type === 'receita' ? c.type === 'receita' || c.type === 'ambos'
    : type === 'despesa' ? c.type === 'despesa' || c.type === 'ambos'
    : true
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [accResult, catResult] = await Promise.all([
        getAccounts(),
        getCategories(),
      ]);
      setAccounts(accResult.data as Account[]);
      setCategories(catResult.data as Category[]);
      setIsLoading(false);
    };
    load();
  }, []);

  const onSubmit = async (data: TransactionFormValues) => {
    const formData = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      notes: data.notes || undefined,
      date: format(data.date, 'yyyy-MM-dd'),
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      account_id: data.account_id,
      destination_account_id: data.destination_account_id,
      is_recurring: data.is_recurring,
      recurring_frequency: data.is_recurring ? data.recurring_frequency : undefined,
    };

    let result;
    if (transaction) {
      result = await updateTransaction(transaction.id, formData);
    } else {
      result = await createTransaction(formData);
    }

    if (result.success) {
      toast.success(transaction ? 'Transação atualizada!' : 'Transação criada com sucesso!');
      onSuccess?.();
    } else {
      toast.error(result.error ?? 'Erro ao salvar transação.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Tipo de transação */}
      <div className="space-y-2">
        <Label>Tipo de Transação</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Tabs value={field.value} onValueChange={(v) => {
              field.onChange(v);
              setValue('category_id', undefined);
              setValue('subcategory_id', undefined);
            }}>
              <TabsList className="w-full">
                <TabsTrigger value="despesa" className="flex-1 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  Despesa
                </TabsTrigger>
                <TabsTrigger value="receita" className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  Receita
                </TabsTrigger>
                <TabsTrigger value="transferencia" className="flex-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Transferência
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        />
      </div>

      {/* Valor e Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor *</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                placeholder="0,00"
              />
            )}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data *</Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker date={field.value} onSelect={(d) => field.onChange(d)} />
            )}
          />
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          placeholder="Ex: Mercado, Salário, Aluguel..."
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Categoria e Subcategoria (não para transferências) */}
      {type !== 'transferencia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => {
                  field.onChange(v || undefined);
                  setValue('subcategory_id', undefined);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Controller
                name="subcategory_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Conta(s) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{type === 'transferencia' ? 'Conta de Origem' : 'Conta'}</Label>
          <Controller
            name="account_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {type === 'transferencia' && (
          <div className="space-y-2">
            <Label>Conta de Destino</Label>
            <Controller
              name="destination_account_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar conta destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionais (opcional)"
          rows={2}
          {...register('notes')}
        />
      </div>

      {/* Recorrente */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Transação recorrente</p>
          <p className="text-xs text-muted-foreground">Repete automaticamente</p>
        </div>
        <Controller
          name="is_recurring"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <Label>Frequência</Label>
          <Controller
            name="recurring_frequency"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isLoading} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            transaction ? 'Atualizar' : 'Criar Transação'
          )}
        </Button>
      </div>
    </form>
  );
}
