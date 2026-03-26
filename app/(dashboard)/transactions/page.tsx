import { Suspense } from 'react';
import { TransactionsContent } from '@/components/transactions/TransactionsContent';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Transações' };

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
