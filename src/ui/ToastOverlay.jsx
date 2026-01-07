import React from 'react';
import { useGameState } from '../context/GameState';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastOverlay = () => {
  const { toasts } = useGameState();

  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`
              min-w-[200px] max-w-[300px] p-3 border-l-4 font-mono text-sm shadow-lg backdrop-blur-md bg-black/80
              ${toast.type === 'error' ? 'border-[var(--blood-red)] text-red-400' : 'border-[var(--toxic-green)] text-[var(--toxic-green)]'}
            `}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
