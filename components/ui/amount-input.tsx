"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  id?: string;
  name: string;
  defaultValue?: number;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onChange?: (value: number) => void;
}

// 숫자를 천단위 콤마 포맷으로 변환
function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? value.replace(/,/g, "") : String(value);
  if (!num || isNaN(Number(num))) return "";
  return Number(num).toLocaleString("ko-KR");
}

// 콤마 제거하고 숫자만 추출
function parseNumber(value: string): number {
  const num = value.replace(/[^0-9]/g, "");
  return num ? parseInt(num, 10) : 0;
}

export function AmountInput({
  id,
  name,
  defaultValue,
  placeholder = "10,000",
  required,
  className,
  onChange,
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState(
    defaultValue ? formatNumber(defaultValue) : ""
  );
  const [rawValue, setRawValue] = useState(defaultValue || 0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 키보드가 올라올 때 입력 필드가 보이도록 스크롤
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFocus = () => {
      // 약간의 딜레이 후 스크롤 (키보드 애니메이션 대기)
      setTimeout(() => {
        input.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    };

    input.addEventListener("focus", handleFocus);
    return () => input.removeEventListener("focus", handleFocus);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseNumber(inputValue);

    setRawValue(numericValue);
    setDisplayValue(numericValue > 0 ? formatNumber(numericValue) : "");

    onChange?.(numericValue);
  };

  return (
    <>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9,]*"
        placeholder={placeholder}
        required={required}
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "pl-8 text-lg font-extrabold rounded-2xl border-white/70 bg-white/70 shadow-soft focus:bg-white focus:ring-2 focus:ring-primary/40 h-12",
          className
        )}
      />
      {/* 실제 전송될 숫자값 (콤마 없이) */}
      <input type="hidden" name={name} value={rawValue} />
    </>
  );
}
