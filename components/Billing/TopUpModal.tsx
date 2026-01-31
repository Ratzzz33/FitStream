// components/Billing/TopUpModal.tsx

import React, { useState } from 'react';
import { X, Wallet, Check, Loader2 } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';
import { BillingService } from '../../services/billingService';
import { StorageService } from '../../services/storageService';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PACKAGES = [
  { amount: 5, label: '$5', scans: '~100', discount: 0 },
  { amount: 10, label: '$10', scans: '~220', discount: 10, popular: true },
  { amount: 25, label: '$25', scans: '~600', discount: 20 },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose }) => {
  const { balance, refreshBalance } = useBilling();
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handlePayPal = async () => {
    if (finalAmount < 1) {
      setError('Минимум $1');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderId = await BillingService.createPayPalOrder(finalAmount);

      // Open PayPal popup
      const paypalUrl = `https://www.paypal.com/checkoutnow?token=${orderId}`;
      const popup = window.open(paypalUrl, 'PayPal', 'width=450,height=600');

      // Poll for completion
      const checkInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(checkInterval);

          try {
            const settings = StorageService.getSettings();
            const userId = settings.googleId || StorageService.getUserId();
            const result = await BillingService.capturePayPalOrder(userId, orderId);

            if (result.success) {
              setSuccess(true);
              await refreshBalance();
              setTimeout(() => {
                setSuccess(false);
                onClose();
              }, 2000);
            }
          } catch (e) {
            setLoading(false);
          }
        }
      }, 1000);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="text-emerald-500" size={24} />
            Пополнить баланс
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current balance */}
          {balance && (
            <div className="text-center py-2">
              <span className="text-gray-500">Текущий баланс: </span>
              <span className="font-bold text-gray-900 dark:text-white">${balance.balanceDollars}</span>
            </div>
          )}

          {/* Packages */}
          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => { setSelectedAmount(pkg.amount); setCustomAmount(''); }}
                className={`relative p-3 rounded-xl border-2 transition flex flex-col items-center gap-1
                  ${selectedAmount === pkg.amount && !customAmount
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    Popular
                  </span>
                )}
                <span className="text-lg font-bold text-gray-900 dark:text-white">{pkg.label}</span>
                {pkg.discount > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">-{pkg.discount}%</span>
                )}
                <span className="text-xs text-gray-500">{pkg.scans} сканов</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Другая сумма:</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
              <Check size={16} />
              Баланс пополнен!
            </div>
          )}

          {/* PayPal button */}
          <button
            onClick={handlePayPal}
            disabled={loading || success}
            className="w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.013 4.875-2.134 8.047-7.426 8.047h-2.19a1.736 1.736 0 0 0-1.714 1.467l-1.12 7.106a.641.641 0 0 0 .633.74h3.147l.741-4.694a1.736 1.736 0 0 1 1.714-1.467h1.14c4.637 0 8.27-1.883 9.327-7.335a6.843 6.843 0 0 0 .06-.474 4.044 4.044 0 0 0-3.705-2.849z"/>
                </svg>
                Оплатить через PayPal
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Принимаем карты без аккаунта PayPal
          </p>
        </div>
      </div>
    </div>
  );
};
