"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
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
  // useState에 함수를 저장하면 React가 "함수형 업데이트"로 해석해 즉시 실행하므로,
  // useRef를 사용해 함수 참조를 직접 보관한다.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCancel]);

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
      {isOpen && options && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex animate-in items-center justify-center fade-in-0 p-4 duration-200 motion-reduce:animate-none pointer-events-auto"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            onClick={handleCancel}
          />
          <div
            className="relative z-10 w-full max-w-sm animate-in rounded-3xl bg-white p-6 shadow-2xl fade-in-0 zoom-in-95 duration-200 ease-out motion-reduce:animate-none pointer-events-auto"
          >
            <button
              type="button"
              onClick={handleCancel}
              aria-label="닫기"
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full hover:bg-gray-100 transition-colors pointer-events-auto cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`h-14 w-14 rounded-full ${styles.icon} flex items-center justify-center mb-4`}
              >
                <AlertTriangle className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-bold text-text-main mb-2">
                {options.title || "확인"}
              </h3>

              <p className="text-sm text-text-secondary mb-6 whitespace-pre-line">
                {options.message}
              </p>

              <div className="relative z-10 flex gap-3 w-full pointer-events-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="relative z-10 flex-1 h-12 rounded-xl font-bold pointer-events-auto cursor-pointer"
                >
                  {options.cancelText || "취소"}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  className={`relative z-10 flex-1 h-12 rounded-xl font-bold ${styles.button} pointer-events-auto cursor-pointer`}
                >
                  {options.confirmText || "확인"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
