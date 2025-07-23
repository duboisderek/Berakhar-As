import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Plus, Play, Calendar, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Draw {
  id: string;
  draw_date: string;
  winning_numbers: number[] | null;
  jackpot_amount: number;
  total_tickets: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
}

export default function AdminDraws() {
  const { user } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState<Draw | null>(null);
  const [newDraw, setNewDraw] = useState({
    draw_date: '',
    jackpot_amount: 2500000
  });
  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'root') {
      fetchDraws();
    }
  }, [user]);

  const fetchDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .order('draw_date', { ascending: false });

      if (error) throw error;
      setDraws(data || []);
    } catch (error) {
      console.error('Error fetching draws:', error);
      toast.error('שגיאה בטעינת ההגרלות');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraw = async () => {
    if (!newDraw.draw_date || !newDraw.jackpot_amount) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    try {
      const { error } = await supabase
        .from('draws')
        .insert([{
          draw_date: new Date(newDraw.draw_date).toISOString(),
          jackpot_amount: newDraw.jackpot_amount,
          status: 'scheduled',
          created_by: user?.id
        }]);

      if (error) throw error;

      toast.success('הגרלה נוצרה בהצלחה');
      setShowCreateModal(false);
      setNewDraw({ draw_date: '', jackpot_amount: 2500000 });
      fetchDraws();
    } catch (error) {
      console.error('Error creating draw:', error);
      toast.error('שגיאה ביצירת הגרלה');
    }
  };

  const handleConductDraw = async (drawId: string) => {
    if (winningNumbers.length !== 6) {
      toast.error('יש לבחור בדיוק 6 מספרים זוכים');
      return;
    }

    try {
      // Update draw with winning numbers
      const { error: drawError } = await supabase
        .from('draws')
        .update({
          winning_numbers: winningNumbers,
          status: 'completed'
        })
        .eq('id', drawId);

      if (drawError) throw drawError;

      // Get all tickets for this draw
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('draw_id', drawId);

      if (ticketsError) throw ticketsError;

      // Calculate matches and winnings for each ticket
      const ticketUpdates = tickets?.map(ticket => {
        const matches = ticket.numbers.filter((num: number) => winningNumbers.includes(num)).length;
        let winningAmount = 0;
        let isWinner = false;

        // Prize structure
        if (matches === 6) {
          winningAmount = showDrawModal?.jackpot_amount || 2500000;
          isWinner = true;
        } else if (matches === 5) {
          winningAmount = 50000;
          isWinner = true;
        } else if (matches === 4) {
          winningAmount = 5000;
          isWinner = true;
        } else if (matches === 3) {
          winningAmount = 500;
          isWinner = true;
        }

        return {
          id: ticket.id,
          matches,
          winning_amount: winningAmount,
          is_winner: isWinner
        };
      }) || [];

      // Update all tickets
      for (const update of ticketUpdates) {
        await supabase
          .from('tickets')
          .update({
            matches: update.matches,
            winning_amount: update.winning_amount,
            is_winner: update.is_winner
          })
          .eq('id', update.id);

        // If winner, update user balance and create transaction
        if (update.is_winner && update.winning_amount > 0) {
          const { data: ticket } = await supabase
            .from('tickets')
            .select('user_id')
            .eq('id', update.id)
            .single();

          if (ticket) {
            const { data: userData } = await supabase
              .from('users')
              .select('balance_ils')
              .eq('id', ticket.user_id)
              .single();

            const newBalance = (userData?.balance_ils || 0) + update.winning_amount;

            await supabase
              .from('users')
              .update({ balance_ils: newBalance })
              .eq('id', ticket.user_id);

            await supabase
              .from('transactions')
              .insert([{
                user_id: ticket.user_id,
                type: 'winnings',
                amount_ils: update.winning_amount,
                description: `זכייה בהגרלה - ${update.matches} מספרים תואמים`,
                balance_before: userData?.balance_ils || 0,
                balance_after: newBalance
              }]);
          }
        }
      }

      toast.success('ההגרלה בוצעה בהצלחה!');
      setShowDrawModal(null);
      setWinningNumbers([]);
      fetchDraws();
    } catch (error) {
      console.error('Error conducting draw:', error);
      toast.error('שגיאה בביצוע ההגרלה');
    }
  };

  const toggleWinningNumber = (num: number) => {
    setWinningNumbers(prev => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'completed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'מתוכנן';
      case 'active':
        return 'פעיל';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      default:
        return 'לא ידוע';
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'root')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">אין הרשאה</h1>
          <p>אין לך הרשאות מנהל לגשת לעמוד זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            חזור לפאנל הניהול
          </Link>
          
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">ניהול הגרלות</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Create Draw Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            צור הגרלה חדשה
          </button>
        </motion.div>

        {/* Draws List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">רשימת הגרלות</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : draws.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">אין הגרלות להצגה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draws.map((draw, index) => (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-lg">
                          {new Date(draw.draw_date).toLocaleDateString('he-IL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(draw.status)}`}>
                          {getStatusText(draw.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>ג'קפוט: ₪{draw.jackpot_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>כרטיסים: {draw.total_tickets}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {draw.status === 'scheduled' && (
                        <button
                          onClick={() => setShowDrawModal(draw)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          בצע הגרלה
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {draw.winning_numbers && (
                    <div className="bg-green-50 rounded p-3">
                      <p className="text-sm font-medium text-green-800 mb-2">מספרים זוכים:</p>
                      <div className="flex gap-2">
                        {draw.winning_numbers.map((num, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Draw Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">צור הגרלה חדשה</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך ושעת ההגרלה:
                </label>
                <input
                  type="datetime-local"
                  value={newDraw.draw_date}
                  onChange={(e) => setNewDraw({ ...newDraw, draw_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סכום הג'קפוט (שקלים):
                </label>
                <input
                  type="number"
                  value={newDraw.jackpot_amount}
                  onChange={(e) => setNewDraw({ ...newDraw, jackpot_amount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateDraw}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                צור הגרלה
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                בטל
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Conduct Draw Modal */}
      {showDrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">בצע הגרלה</h3>
            <p className="text-gray-600 mb-4">
              בחר 6 מספרים זוכים עבור הגרלת {new Date(showDrawModal.draw_date).toLocaleDateString('he-IL')}
            </p>
            
            {/* Numbers Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 37 }, (_, i) => i + 1).map((num) => {
                const isSelected = winningNumbers.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => toggleWinningNumber(num)}
                    className={`
                      aspect-square rounded-lg font-bold text-sm transition-all duration-200 
                      ${isSelected 
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg transform scale-105' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                      }
                    `}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Selected Numbers Display */}
            {winningNumbers.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">מספרים זוכים שנבחרו:</h4>
                <div className="flex gap-2 justify-center">
                  {winningNumbers.map((num, index) => (
                    <div
                      key={num}
                      className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <p className="text-center text-green-700 text-sm mt-2">
                  נותרו לבחירה: {6 - winningNumbers.length} מספרים
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => handleConductDraw(showDrawModal.id)}
                disabled={winningNumbers.length !== 6}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                בצע הגרלה
              </button>
              <button
                onClick={() => {
                  setShowDrawModal(null);
                  setWinningNumbers([]);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                בטל
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}