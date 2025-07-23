import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Wallet, 
  Trophy, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalBalance: number;
  todayTickets: number;
  activeDraws: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalBalance: 0,
    todayTickets: 0,
    activeDraws: 0
  });
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'root') {
      fetchAdminStats();
      fetchRecentTransactions();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Pending deposits
      const { count: pendingDeposits } = await supabase
        .from('crypto_deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('crypto_withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Total balance
      const { data: balanceData } = await supabase
        .from('users')
        .select('balance_ils');
      
      const totalBalance = balanceData?.reduce((sum, user) => sum + (user.balance_ils || 0), 0) || 0;

      // Today's tickets
      const today = new Date().toISOString().split('T')[0];
      const { count: todayTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Active draws
      const { count: activeDraws } = await supabase
        .from('draws')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'active']);

      setStats({
        totalUsers: totalUsers || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalBalance,
        todayTickets: todayTickets || 0,
        activeDraws: activeDraws || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('שגיאה בטעינת נתוני המנהל');
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      // Recent deposits
      const { data: deposits } = await supabase
        .from('crypto_deposits')
        .select(`
          *,
          users (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Recent withdrawals
      const { data: withdrawals } = await supabase
        .from('crypto_withdrawals')
        .select(`
          *,
          users (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentDeposits(deposits || []);
      setRecentWithdrawals(withdrawals || []);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApproval = async (type: 'deposit' | 'withdrawal', id: string) => {
    try {
      const table = type === 'deposit' ? 'crypto_deposits' : 'crypto_withdrawals';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'confirmed',
          [`${type === 'deposit' ? 'validated' : 'processed'}_by`]: user?.id,
          [`${type === 'deposit' ? 'validated' : 'processed'}_at`]: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`${type === 'deposit' ? 'הפקדה' : 'משיכה'} אושרה בהצלחה`);
      fetchAdminStats();
      fetchRecentTransactions();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('שגיאה באישור העסקה');
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

  const statCards = [
    {
      title: 'סה"כ משתמשים',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/users'
    },
    {
      title: 'הפקדות ממתינות',
      value: stats.pendingDeposits,
      icon: AlertCircle,
      color: 'from-yellow-500 to-yellow-600',
      link: '/admin/deposits'
    },
    {
      title: 'משיכות ממתינות',
      value: stats.pendingWithdrawals,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      link: '/admin/withdrawals'
    },
    {
      title: 'יתרה כוללת',
      value: `₪${stats.totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      link: '/admin/analytics'
    },
    {
      title: 'כרטיסים היום',
      value: stats.todayTickets,
      icon: Trophy,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/draws'
    },
    {
      title: 'הגרלות פעילות',
      value: stats.activeDraws,
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      link: '/admin/draws'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/home"
            className="text-white hover:text-blue-200 transition-colors"
          >
            חזור לדף הבית
          </Link>
          
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">פאנל ניהול</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-2">שלום {user.first_name}!</h2>
          <p className="text-blue-200">ברוך הבא לפאנל הניהול של ברכה והצלחה</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={stat.link}
                className="block bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{stat.title}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">פעולות מהירות</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/deposits"
              className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Wallet className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">אשר הפקדות</div>
            </Link>
            <Link
              to="/admin/withdrawals"
              className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg text-center hover:from-red-600 hover:to-red-700 transition-all"
            >
              <DollarSign className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">אשר משיכות</div>
            </Link>
            <Link
              to="/admin/users"
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">ניהול משתמשים</div>
            </Link>
            <Link
              to="/admin/draws"
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">ניהול הגרלות</div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Deposits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">הפקדות אחרונות</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentDeposits.length === 0 ? (
              <p className="text-gray-500 text-center py-8">אין הפקדות אחרונות</p>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">{deposit.users?.first_name} {deposit.users?.last_name}</div>
                      <div className="text-sm text-gray-600">{deposit.crypto_type} - ₪{deposit.ils_amount}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        deposit.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {deposit.status === 'pending' ? 'ממתין' : 
                         deposit.status === 'confirmed' ? 'אושר' : 'נדחה'}
                      </span>
                      {deposit.status === 'pending' && (
                        <button
                          onClick={() => handleQuickApproval('deposit', deposit.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Withdrawals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">משיכות אחרונות</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentWithdrawals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">אין משיכות אחרונות</p>
            ) : (
              <div className="space-y-3">
                {recentWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">{withdrawal.users?.first_name} {withdrawal.users?.last_name}</div>
                      <div className="text-sm text-gray-600">{withdrawal.crypto_type} - ₪{withdrawal.ils_amount}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        withdrawal.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {withdrawal.status === 'pending' ? 'ממתין' : 
                         withdrawal.status === 'confirmed' ? 'אושר' : 'נדחה'}
                      </span>
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => handleQuickApproval('withdrawal', withdrawal.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}