'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit2, Trash2, PiggyBank, Baby, TrendingUp, Banknote, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { deleteAsset } from '@/lib/asset-actions'
import AssetDialog from './asset-dialog'

interface Asset {
  id: string
  name: string
  type: string
  current_amount: number
  is_liability: boolean
  owner_type?: string
  owner_profile_id?: string | null
  child_name?: string | null
}

interface Member {
  id: string
  full_name: string | null
}

interface AssetsListClientProps {
  assets: Asset[]
  members?: Member[]
  currentUserId?: string
}

const ASSET_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  // 대문자 타입 (PRD 표준)
  CASH: { icon: Banknote, label: '현금', color: '#8B5CF6' },
  SAVINGS: { icon: PiggyBank, label: '저금', color: '#10B981' },
  INVESTMENT: { icon: TrendingUp, label: '투자', color: '#3B82F6' },
  CHILD_SAVINGS: { icon: Baby, label: '자녀', color: '#F59E0B' },
  DEBT: { icon: CreditCard, label: '부채', color: '#EF4444' },
  OTHER: { icon: PiggyBank, label: '기타', color: '#6B7280' },
  // 소문자 타입 (하위 호환)
  savings: { icon: PiggyBank, label: '저금', color: '#10B981' },
  child: { icon: Baby, label: '자녀', color: '#F59E0B' },
  investment: { icon: TrendingUp, label: '투자', color: '#3B82F6' },
  cash: { icon: Banknote, label: '현금', color: '#8B5CF6' },
  debt: { icon: CreditCard, label: '부채', color: '#EF4444' },
}

export default function AssetsListClient({ assets, members = [], currentUserId = "" }: AssetsListClientProps) {
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`'${name}' 자산을 삭제하시겠습니까?`)) return

    const result = await deleteAsset(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('자산이 삭제되었습니다.')
    }
  }

  function handleEdit(asset: Asset) {
    setEditingAsset(asset)
    setIsDialogOpen(true)
  }

  function handleCloseDialog() {
    setIsDialogOpen(false)
    setEditingAsset(null)
  }

  // Group assets by type
  const groupedAssets = assets.reduce((acc, asset) => {
    const type = asset.type
    if (!acc[type]) acc[type] = []
    acc[type].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedAssets).map(([type, typeAssets]) => {
          const config = ASSET_TYPE_CONFIG[type] || ASSET_TYPE_CONFIG.savings
          const Icon = config.icon
          const total = typeAssets.reduce((sum, a) => sum + a.current_amount, 0)

          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Icon className="h-4 w-4" style={{ color: config.color }} />
                <span className="text-sm font-bold text-muted-foreground">{config.label} 자산</span>
                <span className="text-xs font-black ml-auto" style={{ color: config.color }}>
                  ₩{total.toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {typeAssets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: config.color + '20' }}
                      >
                        <Icon className="h-6 w-6" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-foreground break-words line-clamp-2">
                          {asset.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {asset.is_liability ? '부채' : config.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          className={`text-sm sm:text-base font-black whitespace-nowrap text-right ${
                            asset.is_liability ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {asset.is_liability ? '-' : ''}₩
                          {asset.current_amount.toLocaleString()}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleEdit(asset)} className="gap-2">
                              <Edit2 className="h-4 w-4" /> 수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(asset.id, asset.name)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <AssetDialog isOpen={isDialogOpen} onClose={handleCloseDialog} assetToEdit={editingAsset} members={members} currentUserId={currentUserId} />
    </>
  )
}
