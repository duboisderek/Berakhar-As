import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  Minus, 
  Trophy, 
  Clock, 
  Ticket,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LotteryGrid from '../components/LotteryGrid';
import CountdownTimer from '../components/CountdownTimer';
import FloatingContact from '../components/FloatingContact';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(user?.balance_ils || 0);
  const [nextDraw, setNextDraw] = useState<Date>(new Date());
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchNextDraw();
      fetchUserTickets();
    }
  }, [user]);

  // Calculate next draw (Thursday 8 PM or Sunday 8 PM)
  useEffect(() => {
    const now = new Date();
    const nextDrawDate = new Date();
    
    // Get current day (0 = Sunday, 4 = Thursday)
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    if (currentDay === 4) { // Thursday
      if (currentHour < 20) {
        // Today at 8 PM
        nextDrawDate.setHours(20, 0, 0, 0);
      } else {
        // Next Sunday at 8 PM
        nextDrawDate.setDate(now.getDate() + 3);
        nextDrawDate.setHours(20, 0, 0, 0);
      }
    } else if (currentDay === 0) { // Sunday
      if (currentHour < 20) {
        // Today at 8 PM
        nextDrawDate.setHours(20, 0, 0, 0);
      } else {
        // Next Thursday at 8 PM
        nextDrawDate.setDate(now.getDate() + 4);
        nextDrawDate.setHours(20, 0, 0, 0);
      }
    } else if (currentDay < 4) { // Monday to Wednesday
      // Next Thursday at 8 PM
      nextDrawDate.setDate(now.getDate() + (4 - currentDay));
      nextDrawDate.setHours(20, 0, 0, 0);
    } else { // Friday or Saturday
      // Next Sunday at 8 PM
      nextDrawDate.setDate(now.getDate() + (7 - currentDay));
      nextDrawDate.setHours(20, 0, 0, 0);
    }
    
    setNextDraw(nextDrawDate);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance_ils')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) setBalance(data.balance_ils);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchNextDraw = async () => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .eq('status', 'scheduled')
        .order('draw_date', { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setNextDraw(new Date(data[0].draw_date));
      }
    } catch (error) {
      console.error('Error fetching next draw:', error);
    }
  };

  const fetchUserTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          draws (
            draw_date,
            status,
            winning_numbers
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserTickets(data || []);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTicket = async (numbers: number[]) => {
    if (!user || balance < 50) {
      throw new Error('יתרה לא מספיקה');
    }

    try {
      // Get or create next scheduled draw
      let { data: draw, error: drawError } = await supabase
        .from('draws')
        .select('*')
        .eq('status', 'scheduled')
        .order('draw_date', { ascending: true })
        .limit(1)
        .single();

      if (drawError || !draw) {
        // Create next draw
        const { data: newDraw, error: createDrawError } = await supabase
          .from('draws')
          .insert([{
            draw_date: nextDraw.toISOString(),
            jackpot_amount: 2500000,
            status: 'scheduled'
          }])
          .select()
          .single();

        if (createDrawError) throw createDrawError;
        draw = newDraw;
      }

      // Create ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          user_id: user.id,
          draw_id: draw.id,
          numbers: numbers,
          cost_ils: 50
        }]);

      if (ticketError) throw ticketError;

      // Update user balance
      const newBalance = balance - 50;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance_ils: newBalance })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'ticket_purchase',
          amount_ils: -50,
          description: `רכישת כרטיס לוטו - מספרים: ${numbers.join(', ')}`,
          balance_before: balance,
          balance_after: newBalance
        }]);

      setBalance(newBalance);
      fetchUserTickets();
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error('שגיאה בהתנתקות');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" dir="rtl">
      <FloatingContact />
      
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/20 text-red-100 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-white text-right">
              <div className="font-bold">שלום, {user?.first_name}!</div>
              <div className="text-blue-200 text-sm">יתרת חשבון: ₪{balance.toLocaleString()}</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Balance & Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold">יתרת החשבון</h3>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-4">₪{balance.toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 justify-center">
                <Plus className="w-4 h-4" />
                הפקד
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 justify-center">
                <Minus className="w-4 h-4" />
                משוך
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold">הג'קפוט הנוכחי</h3>
            </div>
            <div className="text-3xl font-bold text-amber-400 mb-2">₪2,850,000</div>
            <p className="text-blue-200 text-sm">1,247 משתתפים</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Ticket className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold">הכרטיסים שלי</h3>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">{userTickets.length}</div>
            <p className="text-blue-200 text-sm">כרטיסים פעילים</p>
          </motion.div>
        </div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CountdownTimer targetDate={nextDraw} />
        </motion.div>

        {/* Lottery Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <LotteryGrid 
            onPurchaseTicket={handlePurchaseTicket}
            userBalance={balance}
          />
        </motion.div>

        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            הכרטיסים האחרונים שלי
          </h2>
          
          {userTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">עדיין לא רכשת כרטיסים</p>
              <p>רכוש את הכרטיס הראשון שלך וזכה בגדול!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <div className="flex gap-2 mb-2">
                      {ticket.numbers.map((num: number, numIndex: number) => (
                        <div
                          key={numIndex}
                          className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      נרכש בתאריך: {new Date(ticket.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">₪{ticket.cost_ils}</div>
                    {ticket.is_winner && (
                      <div className="text-sm text-green-700 font-semibold">
                        זוכה! ₪{ticket.winning_amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}