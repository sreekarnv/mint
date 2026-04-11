'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CurrencyInputProps {
  value?: number;
  onChange: (cents: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  placeholder = '0.00',
  disabled,
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState('');

  const displayValue = useMemo(() => {
    if (value !== undefined && inputValue === '') {
      return (value / 100).toFixed(2);
    }
    return inputValue;
  }, [value, inputValue]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value.replace(/[^0-9.]/g, '');
    setInputValue(input);
    const num = parseFloat(input);
    if (!isNaN(num)) {
      onChange(Math.round(num * 100));
    } else {
      onChange(0);
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-7"
        />
      </div>
    </div>
  );
}
