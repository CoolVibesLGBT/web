import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';



interface QuickMessage {
  id: number;
  text: string;
}


interface QuickMessagesProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: QuickMessage) => void;
  userName: string;
}

const QuickMessages: React.FC<QuickMessagesProps> = ({ isOpen, onClose, onSendMessage, userName }) => {
  const { theme } = useTheme();


   const quickMessages : QuickMessage[] = [
  { id: 1, text: "You look like trouble. I’m into it 😈" },
  { id: 2, text: "Your lips look like they have stories to tell. Wanna share one?" },
  { id: 3, text: "I dare you to flirt back… or more 👀" },
  { id: 4, text: "That smirk in your photo? Unfair." },
  { id: 5, text: "I’m not just here for the chat… unless the chat gets spicy 🌶️" },
  { id: 6, text: "I like your vibe. I’d like it even closer." },
  { id: 7, text: "Should we skip small talk and get to the tension?" },
  { id: 8, text: "What would you whisper in my ear if we met tonight?" },
  { id: 9, text: "Some matches are hot. Ours might melt my screen 🔥" },
  { id: 10, text: "Let’s not pretend we don’t feel this chemistry." },
  { id: 11, text: "Tell me your favorite way to be kissed… slowly or suddenly?" },
  { id: 12, text: "You + me + one bed = interesting evening?" },
  { id: 13, text: "Your type? Or should I show you why I’m your type?" },
  { id: 14, text: "We could get to know each other… or just get lost in each other." },
  { id: 15, text: "I'm curious how soft your skin is. Too soon?" },
  { id: 16, text: "Let’s make this night unforgettable — your place or mine?" },
  { id: 17, text: "Wanna see if we match as well in person as we do here?" },
  { id: 18, text: "Just say the word and I’m yours tonight." },
  { id: 19, text: "You tempt me in all the best ways." },
  { id: 20, text: "Careful. I bite... only when invited." },
  { id: 21, text: "What if this chat ends with your hands on my hips?" },
  { id: 22, text: "Would you like to be the reason I can’t focus tomorrow?" },
  { id: 23, text: "Your bed or mine? Or both. I’m flexible 😉" },
  { id: 24, text: "I’ll be honest — I didn’t swipe right for conversation only." },
  { id: 25, text: "Let’s stop imagining and make tonight real." }
];
  
  const handleMessageSelect = (gift: QuickMessage) => {
    onSendMessage(gift);
    onClose();
  };

  return (
  <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-5 w-full h-full flex items-center justify-center p-0 m-0"
          onClick={onClose}
        >
          {/* Enhanced Blur Background */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

          {/* Gift Selector Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 280 }}
            className={`relative h-full w-full rounded-lg overflow-hidden  bg-transparent backdrop-blur-sm ring-1 ring-white/10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-2 border-b ${
              theme === 'dark' ? 'border-white/10' : 'border-white/20'
            } ${
              theme === 'dark'
                ? 'bg-black/10'
                : 'bg-white/10'
            } backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold text-white`}>
                    Send Quick Message
                  </h3>
                  <p className={`text-sm mt-1 text-white`}>
                    to {userName}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`p-2 rounded-full transition-all duration-200  text-white border border-white/10`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Gifts Grid */}
            <div className="p-4 max-h-[355px] overflow-y-auto scrollbar-hide">
              <div className="flex flex-col gap-2">
                {quickMessages.map((message) => (
                  <motion.button
                    key={message.id}
                  
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleMessageSelect(message)}
                    className={`relative p-2 flex items-center justify-center rounded-xl border border-1 border-white/30 hover:border-white/50 transition-all duration-300  hover:shadow-xl group overflow-hidden`}
                  >
                 

                    {/* Glass Shimmer Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </div>

                    {/* Gift Icon */}
                    <div className={`relative flex items-center justify-center z-10`}>
                      <motion.div
                   
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="relative"
                      >
                        <span className='text-white text-sm'>{message.text}</span>
                  
                      </motion.div>
                    </div>

             
               
                   
                     </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${
              theme === 'dark'
                ? 'border-white/10 bg-black/10'
                : 'border-white/20 bg-white/10'
            } backdrop-blur-sm`}>
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                <p className={`text-sm text-center font-medium text-white`}>
                  Choose the perfect message for {userName}
                </p>
                <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickMessages;
