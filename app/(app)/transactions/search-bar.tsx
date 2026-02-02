'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue || '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) {
      router.push(`/transactions?q=${encodeURIComponent(value)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="검색어 입력 (메모, 금액 등)"
        className="pl-9 h-10 w-full rounded-2xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:bg-white transition-all"
      />
    </form>
  )
}
