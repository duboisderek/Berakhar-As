import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CryptoDeposit from '../components/CryptoDeposit';
import toast from 'react-hot-toast';

interface Deposit {
  id: string;
  crypto_type: string;
  crypto_amount: number;
  ils_amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  transaction_hash?: string;
  notes?: string;
}

export default function DepositPage() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeposits();
    }
  }, [user]);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_deposits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast.error('שגיאה בטעינת ההפקדות');
    } finally {
      setLoading(false);
    }
  };

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
            <Wallet className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">הפקדת כספים</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Deposit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CryptoDeposit 
            userId={user?.id || ''} 
            onDepositCreated={fetchDeposits}
          />
        </motion.div>

        {/* Deposits History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">היסטוריית הפקדות</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">עדיין לא ביצעת הפקדות</p>
              <p>בצע את ההפקדה הראשונה שלך למעלה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit, index) => (
                <motion.div
                  key={deposit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{deposit.crypto_type}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(deposit.status)}`}>
                          {getStatusIcon(deposit.status)}
                          <span className="mr-1">{getStatusText(deposit.status)}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {new Date(deposit.created_at).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg text-green-600">
                        ₪{deposit.ils_amount.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {deposit.crypto_amount} {deposit.crypto_type}
                      </div>
                    </div>
                  </div>
                  
                  {deposit.transaction_hash && (
                    <div className="bg-gray-50 rounded p-2 mb-2">
                      <p className="text-xs text-gray-600 mb-1">Hash עסקה:</p>
                      <p className="font-mono text-xs break-all">{deposit.transaction_hash}</p>
                    </div>
                  )}
                  
                  {deposit.notes && (
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-blue-600 mb-1">הערות:</p>
                      <p className="text-sm text-blue-800">{deposit.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}