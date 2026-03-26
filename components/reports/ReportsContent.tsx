'use client';

import { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getTransactions, getCategoryExpenses, getMonthlyEvolution } from '@/lib/actions/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatMonthYear, sumByType } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

export function ReportsContent() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<Array<{ name: string; value: number; color: string; percentage: number }>>([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState<Array<{ month: string; receitas: number; despesas: number; saldo: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [txResult, catResult, evResult] = await Promise.all([
      getTransactions({ month, year }),
      getCategoryExpenses(month, year),
      getMonthlyEvolution(),
    ]);
    setTransactions(txResult.data as Transaction[]);
    setCategoryExpenses(catResult);
    setMonthlyEvolution(evResult);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [month, year]);

  const receitas = sumByType(transactions, 'receita');
  const despesas = sumByType(transactions, 'despesa');
  const saldo = receitas - despesas;

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const exportCSV = () => {
    if (transactions.length === 0) { toast.warning('Nenhum dado para exportar.'); return; }
    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Valor'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description}"`,
      t.type,
      t.category?.name ?? '',
      t.account?.name ?? '',
      t.amount.toFixed(2).replace('.', ','),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório CSV exportado!');
  };

  // Dados para gráfico de barras mensal
  const barData = [
    { name: 'Receitas', value: receitas, fill: '#22c55e' },
    { name: 'Despesas', value: despesas, fill: '#ef4444' },
    { name: 'Saldo', value: Math.abs(saldo), fill: saldo >= 0 ? '#6366f1' : '#f97316' },
  ];

  // Formatar labels do eixo X da evolução
  const evolutionData = monthlyEvolution.map(d => {
    const [y, m] = d.month.split('-').map(Number);
    return {
      ...d,
      label: format(new Date(y, m - 1, 1), 'MMM/yy'),
    };
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Análise financeira detalhada</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center">
              {formatMonthYear(month, year)}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Receitas</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(receitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Despesas</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(despesas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo do Mês</p>
            <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {saldo >= 0 ? '+' : ''}{formatCurrency(saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de gráficos */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
        </TabsList>

        {/* Visão geral */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo — {formatMonthYear(month, year)}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), '']}
                      contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por categoria */}
        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : categoryExpenses.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <BarChart2 className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma despesa categorizada</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryExpenses} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
                        {categoryExpenses.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : categoryExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                ) : (
                  categoryExpenses.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                        <span className="text-sm font-semibold">{formatCurrency(cat.value)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evolução */}
        <TabsContent value="evolution" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução dos Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evolutionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        formatCurrency(v),
                        name === 'receitas' ? 'Receitas' : 'Despesas'
                      ]}
                      contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <Legend
                      formatter={(v) => v === 'receitas' ? 'Receitas' : 'Despesas'}
                      iconType="circle" iconSize={8}
                    />
                    <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
