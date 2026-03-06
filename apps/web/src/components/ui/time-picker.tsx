'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  accentColor?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

export function TimePicker({ value, onChange, className, accentColor = '#10b981' }: TimePickerProps) {
  const [hour, minute] = value ? value.split(':') : ['09', '00']

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute || '00'}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour || '09'}:${newMinute}`)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Select value={hour} onValueChange={handleHourChange}>
        <SelectTrigger 
          className="w-16 h-9 rounded-lg focus:ring-2" 
          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
        >
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent accentColor={accentColor}>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-gray-400 font-medium">:</span>
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger 
          className="w-16 h-9 rounded-lg focus:ring-2" 
          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
        >
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent accentColor={accentColor}>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
