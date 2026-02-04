"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
  };

  const variantStyles = {
    danger: {
      icon: "bg-red-100 text-red-600",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: "bg-amber-100 text-amber-600",
      button: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    default: {
      icon: "bg-primary/10 text-primary",
      button: "bg-primary hover:bg-primary/90 text-white",
    },
  };

  const styles = variantStyles[options?.variant || "danger"];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`h-14 w-14 rounded-full ${styles.icon} flex items-center justify-center mb-4`}>
                  <AlertTriangle className="h-7 w-7" />
                </div>

                <h3 className="text-lg font-bold text-text-main mb-2">
                  {options.title || "확인"}
                </h3>

                <p className="text-sm text-text-secondary mb-6">
                  {options.message}
                </p>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 h-12 rounded-xl font-bold"
                  >
                    {options.cancelText || "취소"}
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className={`flex-1 h-12 rounded-xl font-bold ${styles.button}`}
                  >
                    {options.confirmText || "확인"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
