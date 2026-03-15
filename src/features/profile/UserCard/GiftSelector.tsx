
import React, { useState } from 'react';

import { X } from 'lucide-react';

interface GiftItem {
  id: number;
  name: string;
  emoji: string;
  price: number;
}

interface GiftSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGift: (gift: GiftItem) => void;
  userName: string;
}

const gifts: GiftItem[] = [
  { id: 1, name: 'Rose', emoji: '🌹', price: 10 },
  { id: 2, name: 'Lollipop', emoji: '🍭', price: 20 },
  { id: 3, name: 'Diamond', emoji: '💎', price: 1000 },
  { id: 4, name: 'Teddy Bear', emoji: '🧸', price: 150 },
  { id: 5, name: 'Heart', emoji: '❤️', price: 50 },
  { id: 6, name: 'Ring', emoji: '💍', price: 500 },
  { id: 7, name: 'Unicorn', emoji: '🦄', price: 750 },
  { id: 8, name: 'Rocket', emoji: '🚀', price: 2000 },
];

const GiftSelector: React.FC<GiftSelectorProps> = ({ isOpen, onClose, onSelectGift, userName }) => {
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);

  if (!isOpen) return null;

  const handleSendGift = () => {
    if (selectedGift) {
      onSelectGift(selectedGift);
      onClose();
    }
  };

  return (
    <div 
      className="w-full h-full inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full h-full text-white rounded-2xl shadow-xl w-full max-w-md flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Send a Gift to {userName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {gifts.map((gift) => (
              <button 
                key={gift.id} 
                onClick={() => setSelectedGift(gift)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg aspect-square transition-all duration-200 transform hover:scale-105 ${
                  selectedGift?.id === gift.id 
                    ? 'bg-purple-600 ring-2 ring-purple-400' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <span className="text-4xl">{gift.emoji}</span>
                <span className="mt-2 text-sm font-medium">{gift.name}</span>
                <span className="text-xs text-yellow-400">{gift.price} coins</span>
              </button>
            ))}
          </div>
        </main>

        <footer className="p-4 border-t border-gray-700">
          <button 
            onClick={handleSendGift}
            disabled={!selectedGift}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
          >
            {selectedGift ? `Send ${selectedGift.name} for ${selectedGift.price} coins` : 'Select a Gift'}
          </button>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GiftSelector;
