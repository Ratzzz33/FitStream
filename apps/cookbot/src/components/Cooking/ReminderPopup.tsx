import React, { useEffect } from 'react';

interface ReminderPopupProps {
  message: string;
  icon: string;
  onDismiss: () => void;
}

export const ReminderPopup: React.FC<ReminderPopupProps> = ({
  message,
  icon,
  onDismiss
}) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-bounce-in pointer-events-auto"
        onClick={onDismiss}
      >
        <div className="text-center mb-4">
          <span className="text-6xl">{icon}</span>
        </div>
        <p className="text-center text-lg font-medium dark:text-white mb-4">
          {message}
        </p>
        <button
          onClick={onDismiss}
          className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <span>OK</span>
        </button>
        <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 animate-shrink-width" />
        </div>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out forwards; }
        .animate-shrink-width { animation: shrink-width 5s linear forwards; }
      `}</style>
    </div>
  );
};

export default ReminderPopup;
