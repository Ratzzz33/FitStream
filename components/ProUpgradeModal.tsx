import React, { useState } from 'react';
import { X, Check, Star, Zap, TrendingUp, Shield, Loader2, Crown } from 'lucide-react';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storageService';

interface ProUpgradeModalProps {
  onClose: () => void;
  onUpgradeMock?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ onClose, onUpgradeMock }) => {
  const [loading, setLoading] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(false);
  
  const handleSubscribe = async () => {
      setLoading(true);
      
      try {
          // 1. Get current User ID
          const userId = StorageService.getUserId();
          
          // 2. Call backend to get Stripe URL
          const url = await ApiService.createCheckoutSession(userId);
          
          if (url) {
              // 3. Redirect to Stripe
              window.location.href = url;
          } else {
              // Fallback for demo/error
              activateDemoMode();
          }
      } catch (e) {
          activateDemoMode();
      }
  };

  const activateDemoMode = () => {
      setLoading(false);
      setDemoModeActive(true);
      // Automatically close and apply after a brief success message
      setTimeout(() => {
          if (onUpgradeMock) onUpgradeMock();
      }, 1500);
  };

  if (demoModeActive) {
      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm border border-yellow-500/50 p-8 text-center animate-in zoom-in duration-300">
                 <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Crown size={40} className="text-yellow-500 animate-bounce" />
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Demo Mode Activated!</h2>
                 <p className="text-gray-500 dark:text-gray-400">Backend unavailable. You are now Pro for this session.</p>
             </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm border border-yellow-500/30 overflow-hidden shadow-2xl relative animate-in fade-in slide-in-from-bottom-8 duration-300">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur p-2 rounded-full text-white z-20 transition"
        >
            <X size={20} />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-yellow-400 to-orange-600 p-8 pt-12 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
             <div className="relative z-10">
                 <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/50 shadow-lg">
                     <Star size={40} className="text-white fill-white" />
                 </div>
                 <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Go Pro</h2>
                 <p className="text-white/90 font-medium mt-1">Unlock your full potential</p>
             </div>
        </div>

        {/* Features */}
        <div className="p-6 space-y-4">
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">Unlimited AI Workouts</p>
                        <p className="text-xs text-gray-500">No daily or weekly limits.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">Full History & Analytics</p>
                        <p className="text-xs text-gray-500">See progress over months.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">Smart Form Correction</p>
                        <p className="text-xs text-gray-500">Advanced AI feedback on posture.</p>
                    </div>
                </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center mt-6">
                <p className="text-gray-500 text-sm">Monthly Subscription</p>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">$4.99</span>
                    <span className="text-gray-500">/mo</span>
                </div>
            </div>

            <button 
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-orange-500/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Start 7-Day Free Trial'}
            </button>
            
            <p className="text-xs text-center text-gray-400">
                Secured by Stripe. Cancel anytime.
            </p>
        </div>
      </div>
    </div>
  );
};