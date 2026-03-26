import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  iconColor?: string;
  iconBg?: string;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  trend = 'neutral',
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
}: SummaryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                'text-2xl font-bold tracking-tight',
                trend === 'positive' && 'text-foreground',
                trend === 'negative' && 'text-foreground',
              )}
            >
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-lg', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
