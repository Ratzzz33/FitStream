import React, { useRef, useState, useMemo } from 'react';
import { X, Upload } from 'lucide-react';
import { AVATAR_ANIMALS, AVATAR_THEMES, generateTotem } from '../services/storageService';
import { t } from '../services/i18n';

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ currentAvatar, onSelect, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default to first items if not set
  const [selectedAnimal, setSelectedAnimal] = useState(AVATAR_ANIMALS[0]);
  const [selectedTheme, setSelectedTheme] = useState(AVATAR_THEMES[0]);

  // Live preview of the constructed totem
  const previewAvatar = useMemo(() => {
    return generateTotem(selectedAnimal.emoji, selectedTheme.from, selectedTheme.to);
  }, [selectedAnimal, selectedTheme]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert(t('fileTooLarge'));
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnimalSelect = (animal: typeof AVATAR_ANIMALS[0]) => {
      setSelectedAnimal(animal);
      const newAvatar = generateTotem(animal.emoji, selectedTheme.from, selectedTheme.to);
      onSelect(newAvatar);
  };

  const handleThemeSelect = (theme: typeof AVATAR_THEMES[0]) => {
      setSelectedTheme(theme);
      const newAvatar = generateTotem(selectedAnimal.emoji, theme.from, theme.to);
      onSelect(newAvatar);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('changeAvatar')}</h2>
            <button onClick={onClose} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-500 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={20} />
            </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-6">
            
            {/* Live Preview */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-xl overflow-hidden relative">
                     <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Custom Upload */}
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex items-center justify-center gap-2 transition"
                >
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('uploadPhoto')}</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                />
            </div>

            {/* Animal Selection */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('chooseAnimal')}</h3>
                <div className="grid grid-cols-6 gap-2">
                    {AVATAR_ANIMALS.map((animal) => (
                        <button
                            key={animal.id}
                            onClick={() => handleAnimalSelect(animal)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedAnimal.id === animal.id ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'bg-gray-50 dark:bg-gray-800/30'}`}
                        >
                            {animal.emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Background Selection */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('chooseBackground')}</h3>
                <div className="grid grid-cols-4 gap-3">
                    {AVATAR_THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeSelect(theme)}
                            className={`h-10 rounded-lg transition relative overflow-hidden ${selectedTheme.id === theme.id ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                        >
                            <span className="sr-only">{theme.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};