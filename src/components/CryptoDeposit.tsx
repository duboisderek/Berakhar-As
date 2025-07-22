import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, QrCode, RefreshCw, Bitcoin, DollarSign, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type CryptoType = 'BTC' | 'ETH' | 'USDT_ERC20' | 'USDT_TRC20';

interface CryptoWallet {
  id: string;
  crypto_type: CryptoType;
  wallet_address: string;
  wallet_name: string;
}

interface CryptoDepositProps {
  userId: string;
  onDepositCreated: () => void;
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

export default function CryptoDeposit({ userId, onDepositCreated }: CryptoDepositProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('BTC');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [ilsAmount, setIlsAmount] = useState<string>('');
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (cryptoAmount && exchangeRates[selectedCrypto]) {
      const ilsValue = parseFloat(cryptoAmount) * exchangeRates[selectedCrypto];
      setIlsAmount(ilsValue.toFixed(2));
    }
  }, [cryptoAmount, selectedCrypto, exchangeRates]);

  useEffect(() => {
    if (ilsAmount && exchangeRates[selectedCrypto]) {
      const cryptoValue = parseFloat(ilsAmount) / exchangeRates[selectedCrypto];
      setCryptoAmount(cryptoValue.toFixed(8));
    }
  }, [ilsAmount, selectedCrypto, exchangeRates]);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('שגיאה בטעינת כתובות הארנקים');
    } finally {
      setLoading(false);
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

  const selectedWallet = wallets.find(w => w.crypto_type === selectedCrypto);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      toast.success('כתובת הארנק הועתקה');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast.error('שגיאה בהעתקת הכתובת');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cryptoAmount || !ilsAmount || !selectedWallet) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    if (parseFloat(ilsAmount) < 100) {
      toast.error('סכום ההפקדה המינימלי הוא ₪100');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('crypto_deposits')
        .insert([{
          user_id: userId,
          crypto_type: selectedCrypto,
          crypto_amount: parseFloat(cryptoAmount),
          wallet_address: selectedWallet.wallet_address,
          ils_amount: parseFloat(ilsAmount),
          exchange_rate: exchangeRates[selectedCrypto],
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('בקשת ההפקדה נשלחה! אנא המתן לאישור המנהל');
      setCryptoAmount('');
      setIlsAmount('');
      onDepositCreated();
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast.error('שגיאה בשליחת בקשת ההפקדה');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">הפקדה קריפטוגרפית</h2>
        <p className="text-gray-600">בחר מטבע קריפטוגרפי והפקד לחשבונך</p>
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

      {/* Amount Input */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סכום ב{cryptoNames[selectedCrypto]}:
            </label>
            <input
              type="number"
              step="0.00000001"
              value={cryptoAmount}
              onChange={(e) => setCryptoAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`0.00000000 ${selectedCrypto}`}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סכום בשקלים:
            </label>
            <input
              type="number"
              step="0.01"
              value={ilsAmount}
              onChange={(e) => setIlsAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00 ₪"
              required
            />
          </div>
        </div>

        {/* Wallet Address Display */}
        {selectedWallet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">כתובת ההפקדה:</h3>
              <button
                type="button"
                onClick={() => fetchExchangeRates()}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">עדכן שער</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
              <div className="flex items-center gap-2 mb-2">
                {cryptoIcons[selectedCrypto]}
                <span className="font-medium">{cryptoNames[selectedCrypto]}</span>
              </div>
              <div className="font-mono text-sm break-all text-gray-800 mb-2">
                {selectedWallet.wallet_address}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(selectedWallet.wallet_address)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                {copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedAddress ? 'הועתק!' : 'העתק כתובת'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">הוראות להפקדה:</h4>
          <ol className="text-blue-800 text-sm space-y-1">
            <li>1. העתק את כתובת הארנק למעלה</li>
            <li>2. שלח את הסכום המדויק למטבע הקריפטוגרפי</li>
            <li>3. לחץ על "שלח בקשת הפקדה" למעלה</li>
            <li>4. המתן לאישור מהמנהל (עד 24 שעות)</li>
            <li>5. היתרה תעודכן לאחר האישור</li>
          </ol>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={submitting || !cryptoAmount || !ilsAmount || parseFloat(ilsAmount) < 100}
          className={`w-full py-4 rounded-lg font-bold text-white transition-all duration-200 ${
            submitting || !cryptoAmount || !ilsAmount || parseFloat(ilsAmount) < 100
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
          }`}
          whileHover={
            submitting || !cryptoAmount || !ilsAmount || parseFloat(ilsAmount) < 100 
              ? {} 
              : { scale: 1.02 }
          }
          whileTap={
            submitting || !cryptoAmount || !ilsAmount || parseFloat(ilsAmount) < 100 
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
            'שלח בקשת הפקדה'
          )}
        </motion.button>
      </form>
    </div>
  );
}