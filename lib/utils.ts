import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Merge classes do Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar valor em Real Brasileiro (BRL)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formatar número com casas decimais
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Formatar data para exibição
export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

// Formatar data longa (ex: "15 de março de 2024")
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Formatar mês e ano (ex: "Março 2024")
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

// Formatar mês curto (ex: "Mar")
export function formatMonthShort(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMM', { locale: ptBR });
}

// Obter nome do mês capitalizado
export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  const name = format(date, 'MMMM', { locale: ptBR });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Obter início e fim do mês atual
export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

// Obter os últimos N meses
export function getLastNMonths(n: number): Array<{ month: number; year: number; label: string }> {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    result.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: format(date, "MMM/yy", { locale: ptBR }),
    });
  }
  return result;
}

// Calcular porcentagem
export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Truncar texto
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

// Gerar cor aleatória de uma lista
export function getRandomColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Converter string de valor monetário para número
export function parseCurrencyInput(value: string): number {
  // Remove "R$", espaços e pontos de milhar, troca vírgula por ponto
  const cleaned = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Formatar input de moeda enquanto o usuário digita
export function formatCurrencyInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  // Converte para centavos e formata
  const amount = parseInt(numbers, 10) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Determinar cor do progresso de orçamento
export function getBudgetProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
}

// Determinar cor do badge de tipo de transação
export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'receita':
      return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400';
    case 'despesa':
      return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
    case 'transferencia':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

// Retornar sinal + ou - para o valor da transação
export function getTransactionSign(type: string): string {
  return type === 'receita' ? '+' : type === 'despesa' ? '-' : '↔';
}

// Validar CPF (opcional)
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(cleaned[10]);
}

// Formatar número de cartão (últimos 4 dígitos)
export function formatCardNumber(lastFour: string): string {
  return `•••• •••• •••• ${lastFour}`;
}

// Debounce simples
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Agrupar transações por data
export function groupTransactionsByDate<T extends { date: string }>(
  transactions: T[]
): Record<string, T[]> {
  return transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, T[]>);
}

// Calcular total de transações por tipo
export function sumByType(
  transactions: Array<{ type: string; amount: number }>,
  type: string
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}
