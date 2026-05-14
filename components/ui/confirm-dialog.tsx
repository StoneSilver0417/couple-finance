"use client";

import {
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
  ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

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
  // useState에 함수를 저장하면 React가 "함수형 업데이트"로 해석해 즉시 실행하므로 useRef 사용
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
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

  const styles = variantStyles[options?.variant ?? "danger"];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Radix Dialog를 사용해 포털/포커스 트랩을 올바르게 처리 */}
      <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogPrimitive.Portal>
          {/* 오버레이 */}
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          {/* 컨텐츠 */}
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-[200] w-full max-w-sm translate-x-[-50%] translate-y-[-50%] outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "duration-200"
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              {options?.title ?? "확인"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {options?.message}
            </DialogPrimitive.Description>

            <div className="bg-white rounded-3xl p-6 mx-4 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`h-14 w-14 rounded-full ${styles.icon} flex items-center justify-center mb-4`}
                >
                  <AlertTriangle className="h-7 w-7" />
                </div>

                <h3 className="text-lg font-bold text-text-main mb-2">
                  {options?.title ?? "확인"}
                </h3>

                <p className="text-sm text-text-secondary mb-6">
                  {options?.message}
                </p>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 h-12 rounded-xl font-bold"
                  >
                    {options?.cancelText ?? "취소"}
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className={`flex-1 h-12 rounded-xl font-bold ${styles.button}`}
                  >
                    {options?.confirmText ?? "확인"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}
