import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Search, Edit, Ban, CheckCircle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'client' | 'admin' | 'root';
  balance_ils: number;
  status: string;
  last_login: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'root') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId);
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`סטטוס המשתמש עודכן ל${newStatus === 'active' ? 'פעיל' : 'מושעה'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('שגיאה בעדכון סטטוס המשתמש');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjustBalance = async (userId: string, amount: number, description: string) => {
    setActionLoading(userId);
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const newBalance = targetUser.balance_ils + amount;
      
      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance_ils: newBalance })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          type: 'admin_adjustment',
          amount_ils: amount,
          description: `התאמת יתרה על ידי מנהל: ${description}`,
          balance_before: targetUser.balance_ils,
          balance_after: newBalance
        }]);

      toast.success('יתרת המשתמש עודכנה בהצלחה');
      fetchUsers();
      setSelectedUser(null);
      setBalanceAmount('');
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('שגיאה בעדכון יתרת המשתמש');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'מנהל';
      case 'root':
        return 'מנהל ראשי';
      default:
        return 'לקוח';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'root':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <Users className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">ניהול משתמשים</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="חיפוש לפי שם או אימייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">רשימת משתמשים ({filteredUsers.length})</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">אין משתמשים להצגה</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">משתמש</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">תפקיד</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">יתרה</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">סטטוס</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">הצטרפות</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {u.first_name} {u.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{u.email}</div>
                          {u.phone && (
                            <div className="text-sm text-gray-500">{u.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                          {getRoleText(u.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-green-600">
                          ₪{u.balance_ils.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status === 'active' ? 'פעיל' : 'מושעה'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="עדכן יתרה"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          {u.role === 'client' && (
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              disabled={actionLoading === u.id}
                              className={`p-1 ${
                                u.status === 'active' 
                                  ? 'text-red-600 hover:text-red-700' 
                                  : 'text-green-600 hover:text-green-700'
                              }`}
                              title={u.status === 'active' ? 'השעה משתמש' : 'הפעל משתמש'}
                            >
                              {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Balance Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">עדכון יתרה</h3>
            <p className="text-gray-600 mb-4">
              עדכון יתרה עבור: {selectedUser.first_name} {selectedUser.last_name}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              יתרה נוכחית: ₪{selectedUser.balance_ils.toLocaleString()}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סכום להוספה/הפחתה (שקלים):
              </label>
              <input
                type="number"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="הכנס סכום (חיובי להוספה, שלילי להפחתה)"
              />
            </div>
            
            <textarea
              placeholder="סיבת העדכון"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
              rows={3}
              id="adjustment-reason"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const amount = parseFloat(balanceAmount);
                  const reason = (document.getElementById('adjustment-reason') as HTMLTextAreaElement).value;
                  if (amount && reason) {
                    handleAdjustBalance(selectedUser.id, amount, reason);
                  } else {
                    toast.error('יש למלא את כל השדות');
                  }
                }}
                disabled={actionLoading === selectedUser.id || !balanceAmount}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedUser.id ? 'מעדכן...' : 'עדכן יתרה'}
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setBalanceAmount('');
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