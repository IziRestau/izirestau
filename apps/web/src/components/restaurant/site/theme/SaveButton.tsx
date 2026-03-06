'use client'

import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaveButtonProps {
  isSaving: boolean
  onSave: () => void
  primaryColor: string
}

export function SaveButton({ isSaving, onSave, primaryColor }: SaveButtonProps) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100">
      <Button
        type="button"
        disabled={isSaving}
        onClick={onSave}
        style={{ backgroundColor: primaryColor }}
        className="text-white h-10 rounded-xl gap-2"
      >
        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Enregistrer
      </Button>
    </div>
  )
}
