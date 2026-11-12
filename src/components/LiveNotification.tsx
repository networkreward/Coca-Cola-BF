import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, ShoppingBag, Bell } from 'lucide-react';
import { formatFCFA } from '../utils';

const FAKE_PHONES = ["07 59 *** 12", "01 42 *** 89", "07 88 *** 34", "06 50 *** 90", "01 01 *** 45", "05 44 *** 23", "07 00 *** 99", "06 11 *** 88"];
const PRODUCTS = ['Pack Coca-Cola Mini', 'Pack Sprite Fresh', 'Pack Fanta Orange', 'Pack Schweppes Tonic'];

interface NotificationData {
  id: number;
  phone: string;
  action: 'DEPOSIT' | 'WITHDRAW' | 'BUY';
  amount?: number;
  product?: string;
}

export default function LiveNotification() {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const triggerRandomNotification = () => {
      const actionRand = Math.random();
      let action: 'DEPOSIT' | 'WITHDRAW' | 'BUY' = 'BUY';
      if (actionRand < 0.33) action = 'DEPOSIT';
      else if (actionRand < 0.66) action = 'WITHDRAW';

      const notif: NotificationData = {
        id: Date.now(),
        phone: FAKE_PHONES[Math.floor(Math.random() * FAKE_PHONES.length)],
        action,
        amount: Math.floor(Math.random() * 50) * 1000 + 5000,
        product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
      };

      setNotification(notif);

      // Hide after 4 seconds
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    };

    // First notification after 3 seconds
    const initialTimeout = setTimeout(triggerRandomNotification, 3000);

    // Then interval every 12 to 20 seconds
    const interval = setInterval(() => {
      triggerRandomNotification();
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="absolute top-4 left-4 right-4 z-50 pointer-events-none"
        >
          <div className="bg-white dark:bg-[#1A1A1A]/95 backdrop-blur-md shadow-lg border border-gray-100 dark:border-[#333] rounded-2xl p-3 flex items-center space-x-3 mx-auto max-w-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              notification.action === 'DEPOSIT' ? 'bg-green-100 text-green-600' :
              notification.action === 'WITHDRAW' ? 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-800 dark:text-gray-200' :
              'bg-[#F40009]/10 text-[#F40009]'
            }`}>
              {notification.action === 'DEPOSIT' && <ArrowUpRight className="w-5 h-5" />}
              {notification.action === 'WITHDRAW' && <ArrowDownRight className="w-5 h-5" />}
              {notification.action === 'BUY' && <ShoppingBag className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-1 mb-0.5">
                <Bell className="w-3 h-3 text-[#F40009]" />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Activité en direct</p>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {notification.phone} a {
                  notification.action === 'DEPOSIT' ? <span className="text-green-600">déposé {formatFCFA(notification.amount!)}</span> :
                  notification.action === 'WITHDRAW' ? <span>retiré {formatFCFA(notification.amount!)}</span> :
                  <span>investi dans <span className="text-[#F40009]">{notification.product}</span></span>
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
