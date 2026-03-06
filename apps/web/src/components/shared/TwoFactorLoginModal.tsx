'use client'

import { useState, useRef, useEffect } from 'react'
import { Smartphone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TwoFactorLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (code: string) => Promise<void>
  isLoading?: boolean
}

export function TwoFactorLoginModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  isLoading = false 
}: TwoFactorLoginModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [isOpen])

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return
    
    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newDigits.every(d => d !== '') && newDigits.join('').length === 6) {
      handleSubmit(newDigits.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      const code = digits.join('')
      if (code.length === 6) {
        handleSubmit(code)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newDigits = pastedData.split('')
      setDigits(newDigits)
      inputRefs.current[5]?.focus()
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (code?: string) => {
    const finalCode = code || digits.join('')
    if (finalCode.length < 6) return
    await onSubmit(finalCode)
  }

  const handleClose = () => {
    setDigits(['', '', '', '', '', ''])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone size={20} className="text-emerald-500" />
            Verification en deux etapes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Entrez le code a 6 chiffres de votre application d'authentification.
          </p>
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="w-10 h-12 sm:w-12 sm:h-14 bg-white border-2 border-gray-200 rounded-xl text-center text-xl sm:text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50"
                maxLength={1}
              />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={digits.join('').length < 6 || isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
              Verifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
