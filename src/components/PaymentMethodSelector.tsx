import { motion } from 'framer-motion';
import { CreditCard, Smartphone, QrCode, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'credit' | 'debit' | 'pix';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const paymentMethods = [
  {
    id: 'credit' as PaymentMethod,
    label: 'Crédito',
    icon: CreditCard,
    description: 'Parcele em até 12x',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'debit' as PaymentMethod,
    label: 'Débito',
    icon: Smartphone,
    description: 'Aprovação instantânea',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'pix' as PaymentMethod,
    label: 'PIX',
    icon: QrCode,
    description: 'Pagamento imediato',
    color: 'from-teal-500 to-cyan-500',
  },
];

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground mb-3">
        Escolha a forma de pagamento:
      </p>
      <div className="grid grid-cols-3 gap-2">
        {paymentMethods.map((method) => {
          const isSelected = selected === method.id;
          const Icon = method.icon;

          return (
            <motion.button
              key={method.id}
              onClick={() => onSelect(method.id)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                  isSelected
                    ? `bg-gradient-to-br ${method.color}`
                    : 'bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isSelected ? 'text-white' : 'text-muted-foreground'
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}
              >
                {method.label}
              </span>

              {/* Description */}
              <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">
                {method.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
