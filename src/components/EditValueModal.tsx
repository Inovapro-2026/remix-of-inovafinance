import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumericKeypad } from '@/components/NumericKeypad';

interface EditValueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  currentValue: number;
  onSave: (value: number) => Promise<void>;
  type?: 'currency' | 'day';
  minValue?: number;
  maxValue?: number;
}

export function EditValueModal({
  open,
  onOpenChange,
  title,
  description,
  currentValue,
  onSave,
  type = 'currency',
  minValue = 0,
  maxValue
}: EditValueModalProps) {
  // Start with empty value so user types the complete new value
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset to empty when modal opens (so user can type a completely new value)
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setValue(''); // Clear value when opening
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let numValue = type === 'currency' 
        ? parseFloat(value.replace(',', '.')) 
        : parseInt(value);
      
      if (isNaN(numValue)) numValue = 0;
      if (numValue < minValue) numValue = minValue;
      if (maxValue !== undefined && numValue > maxValue) numValue = maxValue;
      
      await onSave(numValue);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string) => {
    // Remove non-numeric except comma and dot
    const cleaned = val.replace(/[^\d,\.]/g, '');
    return cleaned;
  };

  const handleValueChange = (val: string) => {
    if (type === 'currency') {
      setValue(formatCurrency(val));
    } else {
      // For day, only allow numbers 1-31
      const num = parseInt(val);
      if (!isNaN(num) && num >= 1 && num <= 31) {
        setValue(val);
      } else if (val === '') {
        setValue('');
      }
    }
  };

  const handleKeypadInput = (num: string) => {
    if (num === 'backspace') {
      setValue(prev => prev.slice(0, -1));
    } else if (num === 'clear') {
      setValue('');
    } else if (num === '.' || num === ',') {
      if (type === 'currency' && !value.includes(',') && !value.includes('.')) {
        setValue(prev => prev + ',');
      }
    } else {
      if (type === 'day') {
        const newVal = value + num;
        const numVal = parseInt(newVal);
        if (numVal >= 1 && numVal <= 31) {
          setValue(newVal);
        }
      } else {
        setValue(prev => prev + num);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              {type === 'currency' ? 'Valor (R$)' : 'Dia do mês'}
            </Label>
            <Input
              type="text"
              inputMode={type === 'currency' ? 'decimal' : 'numeric'}
              value={type === 'currency' ? `R$ ${value}` : value}
              onChange={(e) => {
                const val = e.target.value.replace('R$ ', '');
                handleValueChange(val);
              }}
              className="text-2xl font-bold text-center h-14"
              placeholder={type === 'currency' ? '0,00' : '1'}
            />
          </div>

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-12 text-lg font-medium"
                onClick={() => handleKeypadInput(num)}
              >
                {num}
              </Button>
            ))}
            {type === 'currency' ? (
              <Button
                variant="outline"
                className="h-12 text-lg font-medium"
                onClick={() => handleKeypadInput(',')}
              >
                ,
              </Button>
            ) : (
              <div />
            )}
            <Button
              variant="outline"
              className="h-12 text-lg font-medium"
              onClick={() => handleKeypadInput('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-medium"
              onClick={() => handleKeypadInput('backspace')}
            >
              ⌫
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || !value}
            className="w-full"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
