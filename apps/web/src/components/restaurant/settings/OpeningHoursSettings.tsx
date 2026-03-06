'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Clock, Plus, Trash2, Loader2, Calendar } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { TimePicker } from '@/components/ui/time-picker'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface OpeningHoursSettingsProps {
  openingHours: Array<{
    id: string
    dayOfWeek: number
    isOpen: boolean
    slots: Array<{
      id: string
      openTime: string
      closeTime: string
      serviceTypes: string[]
    }>
  }>
  specialHours: Array<{
    id: string
    date: string
    isClosed: boolean
    reason: string | null
    openTime: string | null
    closeTime: string | null
  }>
  restaurantId: string
  onUpdate: () => void
  primaryColor?: string
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const serviceTypeOptions = [
  { value: 'DELIVERY', label: 'Livraison' },
  { value: 'PICKUP', label: 'A emporter' },
  { value: 'DINE_IN', label: 'Sur place' },
]

interface DaySchedule {
  dayOfWeek: number
  isOpen: boolean
  slots: Array<{
    openTime: string
    closeTime: string
    serviceTypes: string[]
  }>
}

export function OpeningHoursSettings({ openingHours, specialHours, restaurantId, onUpdate, primaryColor = '#10b981' }: OpeningHoursSettingsProps) {
  const initializeSchedule = (): DaySchedule[] => {
    const schedule: DaySchedule[] = []
    for (let i = 0; i < 7; i++) {
      const existing = openingHours.find(oh => oh.dayOfWeek === i)
      if (existing) {
        schedule.push({
          dayOfWeek: i,
          isOpen: existing.isOpen,
          slots: existing.slots.map(s => ({
            openTime: s.openTime,
            closeTime: s.closeTime,
            serviceTypes: s.serviceTypes,
          })),
        })
      } else {
        schedule.push({
          dayOfWeek: i,
          isOpen: i !== 0, // Ferme le dimanche par defaut
          slots: [{ openTime: '11:00', closeTime: '22:00', serviceTypes: ['DELIVERY', 'PICKUP', 'DINE_IN'] }],
        })
      }
    }
    return schedule
  }

  const [schedule, setSchedule] = useState<DaySchedule[]>(initializeSchedule())

  const updateMutation = useMutation({
    mutationFn: async (data: DaySchedule[]) => {
      return api.restaurant.updateOpeningHours(data, restaurantId)
    },
    onSuccess: () => {
      toast.success('Horaires mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const deleteSpecialHourMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.restaurant.deleteSpecialHours(id)
    },
    onSuccess: () => {
      toast.success('Jour special supprime')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, isOpen: !day.isOpen } : day
    ))
  }

  const updateSlot = (dayIndex: number, slotIndex: number, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day
      return {
        ...day,
        slots: day.slots.map((slot, si) => 
          si === slotIndex ? { ...slot, [field]: value } : slot
        ),
      }
    }))
  }

  const toggleServiceType = (dayIndex: number, slotIndex: number, serviceType: string) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day
      return {
        ...day,
        slots: day.slots.map((slot, si) => {
          if (si !== slotIndex) return slot
          const types = slot.serviceTypes.includes(serviceType)
            ? slot.serviceTypes.filter(t => t !== serviceType)
            : [...slot.serviceTypes, serviceType]
          return { ...slot, serviceTypes: types }
        }),
      }
    }))
  }

  const addSlot = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day
      return {
        ...day,
        slots: [...day.slots, { openTime: '11:00', closeTime: '14:00', serviceTypes: ['DELIVERY', 'PICKUP', 'DINE_IN'] }],
      }
    }))
  }

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i !== dayIndex || day.slots.length <= 1) return day
      return {
        ...day,
        slots: day.slots.filter((_, si) => si !== slotIndex),
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(schedule)
  }

  const isLoading = updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Horaires d'ouverture</h3>
        <p className="text-sm text-gray-500">Definissez vos horaires pour chaque jour de la semaine</p>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {/* Reorder to start with Monday (index 1) */}
        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
          const day = schedule[dayIndex]
          return (
            <div key={dayIndex} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={day.isOpen}
                    onCheckedChange={() => toggleDay(dayIndex)}
                    style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                    className="data-[state=checked]:bg-[--switch-checked-bg]"
                  />
                  <span className={`text-sm font-medium ${day.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                    {dayNames[dayIndex]}
                  </span>
                </div>
                {day.isOpen && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(dayIndex)}
                    className="text-xs hover:bg-opacity-10"
                    style={{ color: primaryColor, '--tw-bg-opacity': 0.1, backgroundColor: 'transparent' } as React.CSSProperties}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}15`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Plus size={14} className="mr-1" />
                    Ajouter creneau
                  </Button>
                )}
              </div>

              {day.isOpen && day.slots.map((slot, slotIndex) => (
                <div key={slotIndex} className="pl-10 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <TimePicker
                        value={slot.openTime}
                        onChange={(value) => updateSlot(dayIndex, slotIndex, 'openTime', value)}
                        accentColor={primaryColor}
                      />
                      <span className="text-gray-400">-</span>
                      <TimePicker
                        value={slot.closeTime}
                        onChange={(value) => updateSlot(dayIndex, slotIndex, 'closeTime', value)}
                        accentColor={primaryColor}
                      />
                    </div>
                    {day.slots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlot(dayIndex, slotIndex)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {serviceTypeOptions.map((service) => (
                      <button
                        key={service.value}
                        type="button"
                        onClick={() => toggleServiceType(dayIndex, slotIndex, service.value)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          slot.serviceTypes.includes(service.value)
                            ? 'text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                        style={slot.serviceTypes.includes(service.value) ? { backgroundColor: primaryColor } : undefined}
                      >
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!day.isOpen && (
                <p className="pl-10 text-sm text-gray-400">Ferme</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Special Hours */}
      {specialHours.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Calendar size={16} />
            Jours speciaux
          </h4>
          <div className="space-y-2">
            {specialHours.map((sh) => (
              <div key={sh.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {format(new Date(sh.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-xs text-amber-600">
                    {sh.isClosed ? 'Ferme' : `${sh.openTime} - ${sh.closeTime}`}
                    {sh.reason && ` - ${sh.reason}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSpecialHourMutation.mutate(sh.id)}
                  disabled={deleteSpecialHourMutation.isPending}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-6 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </form>
  )
}
