'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export function NewTransactionContent() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nova Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            onSuccess={() => router.push('/dashboard/transactions')}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
