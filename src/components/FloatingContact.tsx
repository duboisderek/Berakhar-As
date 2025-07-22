import React, { useState } from 'react';
import { MessageCircle, Phone, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      name: 'טלגרם',
      icon: MessageCircle,
      url: 'https://t.me/brachavehatzlacha',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'תמיכה מהירה בטלגרם'
    },
    {
      name: 'וואטסאפ',
      icon: Phone,
      url: 'https://wa.me/972501234567',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'צור קשר בוואטסאפ'
    }
  ];

  return (
    <div className="fixed bottom-6 left-6 z-50" dir="ltr">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="mb-4 space-y-3"
          >
            {contacts.map((contact, index) => (
              <motion.a
                key={contact.name}
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg text-white transition-all duration-200 ${contact.color} hover:shadow-xl hover:scale-105`}
              >
                <contact.icon className="w-5 h-5" />
                <span className="font-medium">{contact.name}</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}