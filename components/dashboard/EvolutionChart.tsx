'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatMonthShort } from '@/lib/utils';

interface EvolutionData {
  month: string; // "YYYY-MM"
  receitas: number;
  despesas: number;
  saldo: number;
}

interface EvolutionChartProps {
  data: EvolutionData[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium mb-2 text-foreground">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function EvolutionChart({ data }: EvolutionChartProps) {
  // Formatar labels do eixo X
  const formattedData = data.map(d => {
    const [year, month] = d.month.split('-').map(Number);
    return {
      ...d,
      label: formatMonthShort(month, year),
    };
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Evolução Patrimonial</CardTitle>
        <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              className="text-muted-foreground"
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) =>
                value === 'receitas' ? 'Receitas' : value === 'despesas' ? 'Despesas' : 'Saldo'
              }
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="receitas"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ fill: '#22c55e', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="despesas"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ fill: '#ef4444', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ fill: '#6366f1', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
