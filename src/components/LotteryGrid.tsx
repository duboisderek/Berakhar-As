import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface LotteryGridProps {
  onPurchaseTicket: (numbers: number[]) => Promise<void>;
  disabled?: boolean;
  userBalance: number;
}

export default function LotteryGrid({ onPurchaseTicket, disabled = false, userBalance }: LotteryGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleNumber = (num: number) => {
    if (disabled || isSubmitting) return;
    
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else if (prev.length < 6) {
        return [...prev, num].sort((a, b) => a - b);
      } else {
        toast.error('ניתן לבחור עד 6 מספרים בלבד');
        return prev;
      }
    });
  };

  const handlePurchase = async () => {
    if (selectedNumbers.length !== 6) {
      toast.error('יש לבחור בדיוק 6 מספרים');
      return;
    }

    if (userBalance < 50) {
      toast.error('יתרה לא מספיקה לרכישת כרטיס');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPurchaseTicket(selectedNumbers);
      setSelectedNumbers([]);
      toast.success('הכרטיס נרכש בהצלחה! בהצלחה!');
    } catch (error) {
      toast.error('שגיאה ברכישת הכרטיס');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelection = () => {
    if (!disabled && !isSubmitting) {
      setSelectedNumbers([]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          בחר 6 מספרים מאושרים
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h2>
        <p className="text-gray-600">
          נותרו לבחירה: <span className="font-bold text-blue-600">{6 - selectedNumbers.length}</span> מספרים
        </p>
      </div>

      {/* Numbers Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 mb-6">
        {Array.from({ length: 37 }, (_, i) => i + 1).map((num) => {
          const isSelected = selectedNumbers.includes(num);
          return (
            <motion.button
              key={num}
              onClick={() => toggleNumber(num)}
              disabled={disabled || isSubmitting}
              className={`
                relative aspect-square rounded-lg font-bold text-sm transition-all duration-200 
                ${isSelected 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
              `}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              animate={isSelected ? { 
                background: ['#f59e0b', '#d97706', '#f59e0b'],
                transition: { duration: 2, repeat: Infinity }
              } : {}}
            >
              {num}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Numbers Display */}
      {selectedNumbers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
        >
          <h3 className="font-semibold text-gray-900 mb-2">המספרים שנבחרו:</h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {selectedNumbers.map((num, index) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md"
              >
                {num}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <motion.button
          onClick={clearSelection}
          disabled={selectedNumbers.length === 0 || disabled || isSubmitting}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          נקה בחירה
        </motion.button>
        
        <motion.button
          onClick={handlePurchase}
          disabled={selectedNumbers.length !== 6 || disabled || isSubmitting || userBalance < 50}
          className={`
            px-8 py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center gap-2
            ${selectedNumbers.length === 6 && userBalance >= 50 && !disabled && !isSubmitting
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed opacity-50'
            }
          `}
          whileHover={selectedNumbers.length === 6 && userBalance >= 50 && !disabled ? { scale: 1.02 } : {}}
          whileTap={selectedNumbers.length === 6 && userBalance >= 50 && !disabled ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              מעבד...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              רכוש כרטיס - ₪50
            </>
          )}
        </motion.button>
      </div>

      {userBalance < 50 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-600 font-medium mt-3"
        >
          יתרה לא מספיקה - יש צורך להפקיד כסף
        </motion.p>
      )}
    </div>
  );
}