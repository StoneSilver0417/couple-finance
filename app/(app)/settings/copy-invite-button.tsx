'use client'

import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export function CopyInviteButton({ inviteCode }: { inviteCode: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(inviteCode)
        toast.success('초대 코드가 복사되었습니다! 📋')
      }}
      className="gap-2 rounded-xl"
    >
      <Copy className="h-3 w-3" />
      복사
    </Button>
  )
}
