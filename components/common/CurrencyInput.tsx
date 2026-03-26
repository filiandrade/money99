'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrencyInput } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Campo de entrada formatado para Real Brasileiro (BRL)
export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  className,
  disabled,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value > 0) {
      setDisplayValue(
        new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)
      );
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCurrencyInput(raw);
    setDisplayValue(formatted);

    // Converter de volta para número
    const numbers = raw.replace(/\D/g, '');
    const numericValue = numbers ? parseInt(numbers, 10) / 100 : 0;
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-9 ${className ?? ''}`}
        disabled={disabled}
      />
    </div>
  );
}
