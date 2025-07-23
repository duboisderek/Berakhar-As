import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Withdrawal {
  id: string;
  user_id: string;
  crypto_type: string;
  crypto_amount: number;
  destination_address: string;
  ils_amount: number;
  exchange_rate: number;
  status: 'pending' | 'confirmed' | 'rejected';
  processed_by: string | null;
  processed_at: string | null;
  transaction_hash: string | null;
  notes: string | null;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AdminWithdrawals() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'root') {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_withdrawals')
        .select(`
          *,
          users (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('שגיאה בטעינת המשיכות');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string, notes?: string) => {
    setActionLoading(withdrawalId);
    try {
      const withdrawal = withdrawals.find(w => w.id === withdrawalId);
      if (!withdrawal) return;

      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('crypto_withdrawals')
        .update({
          status: 'confirmed',
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', withdrawalId);

      if (withdrawalError) throw withdrawalError;

      // Update user balance (deduct the amount)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance_ils')
        .eq('id', withdrawal.user_id)
        .single();

      if (userError) throw userError;

      const newBalance = (userData.balance_ils || 0) - withdrawal.ils_amount;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance_ils: Math.max(0, newBalance) })
        .eq('id', withdrawal.user_id);

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert([{
          user_id: withdrawal.user_id,
          type: 'withdrawal',
          amount_ils: -withdrawal.ils_amount,
          description: `משיכה קריפטוגרפית - ${withdrawal.crypto_type}`,
          balance_before: userData.balance_ils || 0,
          balance_after: Math.max(0, newBalance)
        }]);

      toast.success('המשיכה אושרה בהצלחה');
      fetchWithdrawals();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('שגיאה באישור המשיכה');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, notes: string) => {
    setActionLoading(withdrawalId);
    try {
      const { error } = await supabase
        .from('crypto_withdrawals')
        .update({
          status: 'rejected',
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          notes
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast.success('המשיכה נדחתה');
      fetchWithdrawals();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('שגיאה בדחיית המשיכה');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesFilter = filter === 'all' || withdrawal.status === filter;
    const matchesSearch = 
      withdrawal.users.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.users.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.crypto_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'אושר';
      case 'rejected':
        return 'נדחה';
      default:
        return 'ממתין לאישור';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
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
            <Wallet className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">ניהול משיכות</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'הכל', count: withdrawals.length },
                { key: 'pending', label: 'ממתינות', count: withdrawals.filter(w => w.status === 'pending').length },
                { key: 'confirmed', label: 'מאושרות', count: withdrawals.filter(w => w.status === 'confirmed').length },
                { key: 'rejected', label: 'נדחות', count: withdrawals.filter(w => w.status === 'rejected').length }
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
            
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חיפוש לפי שם או אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Withdrawals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">רשימת משיכות</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">אין משיכות להצגה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWithdrawals.map((withdrawal, index) => (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{withdrawal.users.first_name} {withdrawal.users.last_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          <span className="mr-1">{getStatusText(withdrawal.status)}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{withdrawal.users.email}</p>
                      <p className="text-gray-600 text-sm">
                        {new Date(withdrawal.created_at).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg text-red-600">
                        -₪{withdrawal.ils_amount.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {withdrawal.crypto_amount} {withdrawal.crypto_type}
                      </div>
                      <div className="text-gray-400 text-xs">
                        שער: ₪{withdrawal.exchange_rate.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2 mb-3">
                    <p className="text-xs text-gray-600 mb-1">כתובת יעד:</p>
                    <p className="font-mono text-xs break-all">{withdrawal.destination_address}</p>
                  </div>
                  
                  {withdrawal.transaction_hash && (
                    <div className="bg-green-50 rounded p-2 mb-3">
                      <p className="text-xs text-green-600 mb-1">Hash עסקה:</p>
                      <p className="font-mono text-xs break-all">{withdrawal.transaction_hash}</p>
                    </div>
                  )}
                  
                  {withdrawal.notes && (
                    <div className="bg-yellow-50 rounded p-2 mb-3">
                      <p className="text-xs text-yellow-600 mb-1">הערות:</p>
                      <p className="text-sm text-yellow-800">{withdrawal.notes}</p>
                    </div>
                  )}
                  
                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        disabled={actionLoading === withdrawal.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoading === withdrawal.id ? 'מאשר...' : 'אשר משיכה'}
                      </button>
                      <button
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        דחה משיכה
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Rejection Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">דחיית משיכה</h3>
            <p className="text-gray-600 mb-4">
              האם אתה בטוח שברצונך לדחות את המשיכה של {selectedWithdrawal.users.first_name} {selectedWithdrawal.users.last_name}?
            </p>
            <textarea
              placeholder="סיבת הדחייה (אופציונלי)"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
              rows={3}
              id="rejection-reason"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement).value;
                  handleRejectWithdrawal(selectedWithdrawal.id, reason);
                }}
                disabled={actionLoading === selectedWithdrawal.id}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedWithdrawal.id ? 'דוחה...' : 'דחה משיכה'}
              </button>
              <button
                onClick={() => setSelectedWithdrawal(null)}
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