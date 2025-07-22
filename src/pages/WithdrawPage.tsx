import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Clock, CheckCircle, XCircle, AlertCircle, Bitcoin, DollarSign, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type CryptoType = 'BTC' | 'ETH' | 'USDT_ERC20' | 'USDT_TRC20';

interface Withdrawal {
  id: string;
  crypto_type: string;
  crypto_amount: number;
  ils_amount: number;
  destination_address: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  transaction_hash?: string;
  notes?: string;
}

const cryptoIcons: Record<CryptoType, React.ReactNode> = {
  'BTC': <Bitcoin className="w-6 h-6 text-orange-500" />,
  'ETH': <Coins className="w-6 h-6 text-blue-500" />,
  'USDT_ERC20': <DollarSign className="w-6 h-6 text-green-500" />,
  'USDT_TRC20': <DollarSign className="w-6 h-6 text-green-600" />
};

const cryptoNames: Record<CryptoType, string> = {
  'BTC': 'ביטקוין',
  'ETH': 'אתריום',
  'USDT_ERC20': 'USDT (ERC-20)',
  'USDT_TRC20': 'USDT (TRC-20)'
};

export default function WithdrawPage() {
  const { user } = useAuth();
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('BTC');
  const [ilsAmount, setIlsAmount] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserBalance();
      fetchWithdrawals();
      fetchExchangeRates();
    }
  }, [user]);

  useEffect(() => {
    if (ilsAmount && exchangeRates[selectedCrypto]) {
      const cryptoValue = parseFloat(ilsAmount) / exchangeRates[selectedCrypto];
      setCryptoAmount(cryptoValue.toFixed(8));
    }
  }, [ilsAmount, selectedCrypto, exchangeRates]);

  const fetchUserBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance_ils')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserBalance(data.balance_ils || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=ils'
      );
      const data = await response.json();
      
      setExchangeRates({
        'BTC': data.bitcoin?.ils || 0,
        'ETH': data.ethereum?.ils || 0,
        'USDT_ERC20': data.tether?.ils || 0,
        'USDT_TRC20': data.tether?.ils || 0
      });
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('שגיאה בטעינת שערי החליפין');
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_withdrawals')
        .select('*')
        .eq('user_id', user?.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ilsAmount || !destinationAddress || !cryptoAmount) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    const withdrawalAmount = parseFloat(ilsAmount);
    if (withdrawalAmount < 200) {
      toast.error('סכום המשיכה המינימלי הוא ₪200');
      return;
    }

    if (withdrawalAmount > userBalance) {
      toast.error('יתרה לא מספיקה');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('crypto_withdrawals')
        .insert([{
          user_id: user?.id,
          crypto_type: selectedCrypto,
          crypto_amount: parseFloat(cryptoAmount),
          destination_address: destinationAddress,
          ils_amount: withdrawalAmount,
          exchange_rate: exchangeRates[selectedCrypto],
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('בקשת המשיכה נשלחה! אנא המתן לאישור המנהל');
      setIlsAmount('');
      setCryptoAmount('');
      setDestinationAddress('');
      fetchWithdrawals();
      fetchUserBalance();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error('שגיאה בשליחת בקשת המשיכה');
    } finally {
      setSubmitting(false);
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
            <h1 className="text-xl font-bold text-white">משיכת כספים</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Balance Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white text-center"
        >
          <h3 className="text-lg font-semibold mb-2">יתרת החשבון הנוכחית</h3>
          <div className="text-4xl font-bold text-green-400">₪{userBalance.toLocaleString()}</div>
        </motion.div>

        {/* Withdrawal Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">בקשת משיכה</h2>
            <p className="text-gray-600">בחר מטבע קריפטוגרפי ומשוך את הכספים שלך</p>
          </div>

          {/* Crypto Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              בחר מטבע קריפטוגרפי:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(cryptoNames).map(([crypto, name]) => {
                const cryptoType = crypto as CryptoType;
                const isSelected = selectedCrypto === cryptoType;
                return (
                  <motion.button
                    key={crypto}
                    onClick={() => setSelectedCrypto(cryptoType)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cryptoIcons[cryptoType]}
                    <div className="text-right">
                      <div className="font-semibold">{name}</div>
                      <div className="text-xs opacity-70">
                        ₪{exchangeRates[cryptoType]?.toLocaleString() || '---'}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סכום למשיכה (שקלים):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="200"
                  max={userBalance}
                  value={ilsAmount}
                  onChange={(e) => setIlsAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="מינימום ₪200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סכום ב{cryptoNames[selectedCrypto]}:
                </label>
                <input
                  type="text"
                  value={cryptoAmount}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder={`0.00000000 ${selectedCrypto}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת ארנק יעד:
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`הכנס כתובת ארנק ${selectedCrypto}`}
                required
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ הערות חשובות:</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• סכום משיכה מינימלי: ₪200</li>
                <li>• זמן עיבוד: עד 24 שעות</li>
                <li>• ודא שכתובת הארנק נכונה - לא ניתן לבטל</li>
                <li>• עמלת רשת תנוכה מהסכום</li>
              </ul>
            </div>

            <motion.button
              type="submit"
              disabled={submitting || !ilsAmount || !destinationAddress || parseFloat(ilsAmount) < 200 || parseFloat(ilsAmount) > userBalance}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all duration-200 ${
                submitting || !ilsAmount || !destinationAddress || parseFloat(ilsAmount) < 200 || parseFloat(ilsAmount) > userBalance
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
              }`}
              whileHover={
                submitting || !ilsAmount || !destinationAddress || parseFloat(ilsAmount) < 200 || parseFloat(ilsAmount) > userBalance
                  ? {} 
                  : { scale: 1.02 }
              }
              whileTap={
                submitting || !ilsAmount || !destinationAddress || parseFloat(ilsAmount) < 200 || parseFloat(ilsAmount) > userBalance
                  ? {} 
                  : { scale: 0.98 }
              }
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  שולח בקשה...
                </div>
              ) : (
                'שלח בקשת משיכה'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Withdrawals History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">היסטוריית משיכות</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">עדיין לא ביצעת משיכות</p>
              <p>בצע את המשיכה הראשונה שלך למעלה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal, index) => (
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
                        <span className="font-bold text-lg">{withdrawal.crypto_type}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          <span className="mr-1">{getStatusText(withdrawal.status)}</span>
                        </span>
                      </div>
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
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2 mb-2">
                    <p className="text-xs text-gray-600 mb-1">כתובת יעד:</p>
                    <p className="font-mono text-xs break-all">{withdrawal.destination_address}</p>
                  </div>
                  
                  {withdrawal.transaction_hash && (
                    <div className="bg-green-50 rounded p-2 mb-2">
                      <p className="text-xs text-green-600 mb-1">Hash עסקה:</p>
                      <p className="font-mono text-xs break-all">{withdrawal.transaction_hash}</p>
                    </div>
                  )}
                  
                  {withdrawal.notes && (
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-blue-600 mb-1">הערות:</p>
                      <p className="text-sm text-blue-800">{withdrawal.notes}</p>
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