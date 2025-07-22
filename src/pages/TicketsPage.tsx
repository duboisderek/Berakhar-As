import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Ticket, Trophy, Calendar, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface TicketData {
  id: string;
  numbers: number[];
  cost_ils: number;
  matches: number;
  winning_amount: number;
  is_winner: boolean;
  created_at: string;
  draws: {
    id: string;
    draw_date: string;
    winning_numbers: number[] | null;
    status: string;
    jackpot_amount: number;
  };
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'winners'>('all');

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          draws (
            id,
            draw_date,
            winning_numbers,
            status,
            jackpot_amount
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('שגיאה בטעינת הכרטיסים');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    switch (filter) {
      case 'active':
        return ticket.draws.status === 'scheduled' || ticket.draws.status === 'active';
      case 'completed':
        return ticket.draws.status === 'completed';
      case 'winners':
        return ticket.is_winner;
      default:
        return true;
    }
  });

  const totalSpent = tickets.reduce((sum, ticket) => sum + ticket.cost_ils, 0);
  const totalWinnings = tickets.reduce((sum, ticket) => sum + ticket.winning_amount, 0);
  const winningTickets = tickets.filter(ticket => ticket.is_winner).length;

  const getDrawStatus = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { text: 'מתוכנן', color: 'text-blue-600 bg-blue-50' };
      case 'active':
        return { text: 'פעיל', color: 'text-green-600 bg-green-50' };
      case 'completed':
        return { text: 'הושלם', color: 'text-gray-600 bg-gray-50' };
      case 'cancelled':
        return { text: 'בוטל', color: 'text-red-600 bg-red-50' };
      default:
        return { text: 'לא ידוע', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const renderNumbers = (numbers: number[], winningNumbers?: number[] | null, isWinner?: boolean) => {
    return (
      <div className="flex gap-1 flex-wrap">
        {numbers.map((num, index) => {
          const isWinningNumber = winningNumbers?.includes(num);
          return (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isWinner && isWinningNumber
                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                  : isWinningNumber && winningNumbers
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                  : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
              }`}
            >
              {num}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/home"
            className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            חזור לדף הבית
          </Link>
          
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">הכרטיסים שלי</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white text-center"
          >
            <Ticket className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{tickets.length}</div>
            <div className="text-blue-200 text-sm">סה"כ כרטיסים</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white text-center"
          >
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{winningTickets}</div>
            <div className="text-blue-200 text-sm">כרטיסים זוכים</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-2xl font-bold text-red-400">₪{totalSpent.toLocaleString()}</div>
            <div className="text-blue-200 text-sm">סה"כ הוצאות</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-2xl font-bold text-green-400">₪{totalWinnings.toLocaleString()}</div>
            <div className="text-blue-200 text-sm">סה"כ זכיות</div>
          </motion.div>
        </div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { key: 'all', label: 'כל הכרטיסים', count: tickets.length },
              { key: 'active', label: 'פעילים', count: tickets.filter(t => t.draws.status === 'scheduled' || t.draws.status === 'active').length },
              { key: 'completed', label: 'הושלמו', count: tickets.filter(t => t.draws.status === 'completed').length },
              { key: 'winners', label: 'זוכים', count: winningTickets }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">
                {filter === 'all' ? 'עדיין לא רכשת כרטיסים' : 'אין כרטיסים בקטגוריה זו'}
              </p>
              <p>
                {filter === 'all' ? 'רכוש את הכרטיס הראשון שלך!' : 'נסה לשנות את הפילטר'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => {
                const drawStatus = getDrawStatus(ticket.draws.status);
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      ticket.is_winner ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {ticket.is_winner && <Star className="w-5 h-5 text-yellow-500" />}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${drawStatus.color}`}>
                            {drawStatus.text}
                          </span>
                          <span className="text-sm text-gray-600">
                            כרטיס #{ticket.id.slice(-8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            נרכש: {new Date(ticket.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            הגרלה: {new Date(ticket.draws.draw_date).toLocaleDateString('he-IL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg">₪{ticket.cost_ils}</div>
                        {ticket.is_winner && (
                          <div className="text-green-600 font-bold">
                            זכייה: ₪{ticket.winning_amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">המספרים שלי:</p>
                      {renderNumbers(ticket.numbers, ticket.draws.winning_numbers, ticket.is_winner)}
                    </div>

                    {ticket.draws.winning_numbers && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">המספרים הזוכים:</p>
                        {renderNumbers(ticket.draws.winning_numbers)}
                        {ticket.matches > 0 && (
                          <p className="text-sm text-blue-600 mt-2">
                            {ticket.matches} מספרים תואמים
                          </p>
                        )}
                      </div>
                    )}

                    {ticket.draws.status === 'completed' && !ticket.is_winner && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-600">
                          הכרטיס לא זכה בהגרלה זו. בהצלחה בפעם הבאה!
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}