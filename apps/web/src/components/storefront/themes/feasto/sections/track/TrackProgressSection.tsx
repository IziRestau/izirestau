'use client'

import { Receipt, CheckCircle, ChefHat, Package, Truck } from 'lucide-react'
import type { StoreThemeData } from '../../../_types'

const ORDER_STATUS_STEP_DELIVERY = {
  PENDING: 1,
  CONFIRMED: 2,
  PREPARING: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  COMPLETED: 5,
  CANCELLED: 0,
}

const ORDER_STATUS_STEP_PICKUP = {
  PENDING: 1,
  CONFIRMED: 2,
  PREPARING: 3,
  READY: 4,
  PICKED_UP: 5,
  COMPLETED: 5,
  CANCELLED: 0,
}

interface TrackProgressSectionProps {
  theme: StoreThemeData
  order: {
    status: string
    serviceType: string
  }
  lastUpdated: Date | null
  sectionData?: Record<string, unknown>
}

export function TrackProgressSection({
  theme,
  order,
  lastUpdated,
  sectionData,
}: TrackProgressSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const showLastUpdated = s('showLastUpdated', true) !== false

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  const steps = order.serviceType === 'DELIVERY'
    ? [
        { label: 'Reçue', icon: Receipt },
        { label: 'Confirmée', icon: CheckCircle },
        { label: 'Préparation', icon: ChefHat },
        { label: 'En route', icon: Truck },
        { label: 'Livrée', icon: Package },
      ]
    : [
        { label: 'Reçue', icon: Receipt },
        { label: 'Confirmée', icon: CheckCircle },
        { label: 'Préparation', icon: ChefHat },
        { label: 'Prête', icon: Package },
        { label: 'Récupérée', icon: CheckCircle },
      ]

  const statusMap = order.serviceType === 'DELIVERY' ? ORDER_STATUS_STEP_DELIVERY : ORDER_STATUS_STEP_PICKUP
  const currentStep = statusMap[order.status as keyof typeof statusMap] || 1
  const isCancelled = order.status === 'CANCELLED'

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      timeStyle: 'short',
    }).format(date)
  }

  if (isCancelled) return null

  const progressPercent = currentStep >= steps.length 
    ? 100 
    : ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className={`p-4 sm:p-6 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {/* Progress bar */}
          <div className="relative mb-6">
            <div 
              className="h-2 rounded-full"
              style={{ backgroundColor: `${theme.textColor}10` }}
            />
            <div 
              className="absolute top-0 left-0 h-2 rounded-full transition-all duration-700"
              style={{ 
                backgroundColor: theme.primaryColor,
                width: `${progressPercent}%`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-5 gap-1">
            {steps.map((step, index) => {
              const stepNumber = index + 1
              const isStepCompleted = stepNumber < currentStep
              const isStepCurrent = stepNumber === currentStep
              const isLastStepAndCompleted = stepNumber === steps.length && currentStep >= steps.length
              const StepIcon = step.icon

              return (
                <div 
                  key={step.label} 
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-2 ${btnClass}`}
                    style={{
                      backgroundColor: (isStepCompleted || isLastStepAndCompleted)
                        ? theme.primaryColor 
                        : isStepCurrent 
                          ? `${theme.primaryColor}20`
                          : `${theme.textColor}08`,
                    }}
                  >
                    {(isStepCompleted || isLastStepAndCompleted) ? (
                      <CheckCircle size={18} className="text-white" />
                    ) : (
                      <StepIcon 
                        size={16} 
                        style={{ 
                          color: isStepCurrent ? theme.primaryColor : `${theme.textColor}30` 
                        }} 
                      />
                    )}
                  </div>
                  <span 
                    className="text-[10px] sm:text-xs text-center leading-tight"
                    style={{ 
                      color: (isStepCurrent || isLastStepAndCompleted)
                        ? theme.primaryColor 
                        : isStepCompleted 
                          ? theme.textColor 
                          : `${theme.textColor}40`,
                      fontWeight: (isStepCurrent || isLastStepAndCompleted) ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Last updated */}
          {showLastUpdated && lastUpdated && (
            <p 
              className="text-center text-xs mt-4 opacity-40"
              style={{ color: theme.textColor }}
            >
              Mis à jour à {formatTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
