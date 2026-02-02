import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Send, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { t } from '../services/i18n';
import { StorageService } from '../services/storageService';

interface CookingPromptProps {
  onClose: () => void;
  onSubmit: (query: string, mode: 'available' | 'shopping') => void;
}

export const CookingPrompt: React.FC<CookingPromptProps> = ({ onClose, onSubmit }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'available' | 'shopping'>('available');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get inventory summary for context
  const inventory = StorageService.getInventory();
  const inventoryCount = inventory.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.error('Microphone access denied:', e);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      // Use Gemini for transcription (via existing service)
      const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/webm',
                    data: base64Audio
                  }
                },
                {
                  text: 'Transcribe this audio to text. Return ONLY the transcribed text, nothing else. If the audio is in Russian, keep it in Russian.'
                }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (transcription) {
        setQuery(prev => prev ? `${prev} ${transcription}` : transcription);
      }
    } catch (e) {
      console.error('Transcription error:', e);
      alert('Не удалось распознать речь');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit(query.trim(), mode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-auto sm:min-w-[400px] sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            {t('whatToCook') || 'Что приготовить?'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Inventory context */}
          {inventoryCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Package className="w-4 h-4" />
              <span>У вас {inventoryCount} продуктов в запасах</span>
            </div>
          )}

          {/* Input field */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Например: что-то лёгкое на ужин..."
              className="w-full px-4 py-3 pr-24 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTranscribing}
            />

            {/* Voice button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500'
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || isTranscribing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 text-red-500 text-sm animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Говорите... (нажмите чтобы остановить)
            </div>
          )}

          {/* Mode selection */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Откуда брать продукты?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('available')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                  mode === 'available'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">Из запасов</span>
              </button>

              <button
                onClick={() => setMode('shopping')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                  mode === 'shopping'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Схожу в магазин</span>
              </button>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {['Что-то быстрое', 'Здоровое', 'На ужин', 'Из курицы'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingPrompt;
