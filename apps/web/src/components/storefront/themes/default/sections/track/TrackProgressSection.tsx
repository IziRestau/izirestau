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

  const layout = (s('layout', 'vertical') as string)
  const showLastUpdated = s('showLastUpdated', true) !== false
  const showStepDescription = s('showStepDescription', true) !== false

  const steps = order.serviceType === 'DELIVERY'
    ? [
        { label: 'Reçue', description: 'Commande reçue', icon: Receipt },
        { label: 'Confirmée', description: 'Restaurant confirmé', icon: CheckCircle },
        { label: 'Préparation', description: 'En cuisine', icon: ChefHat },
        { label: 'En route', description: 'Livreur en chemin', icon: Truck },
        { label: 'Livrée', description: 'Bon appétit !', icon: Package },
      ]
    : [
        { label: 'Reçue', description: 'Commande reçue', icon: Receipt },
        { label: 'Confirmée', description: 'Restaurant confirmé', icon: CheckCircle },
        { label: 'Préparation', description: 'En cuisine', icon: ChefHat },
        { label: 'Prête', description: 'À récupérer', icon: Package },
        { label: 'Récupérée', description: 'Bon appétit !', icon: CheckCircle },
      ]

  const statusMap = order.serviceType === 'DELIVERY' ? ORDER_STATUS_STEP_DELIVERY : ORDER_STATUS_STEP_PICKUP
  const currentStep = statusMap[order.status as keyof typeof statusMap] || 1
  const isCancelled = order.status === 'CANCELLED'

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      timeStyle: 'medium',
    }).format(date)
  }

  if (isCancelled) return null

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Carte de progression - même style que les autres sections */}
        <div 
          className="p-4 sm:p-5 rounded-xl"
          style={{ backgroundColor: `${theme.textColor}04` }}
        >
          {/* Timeline */}
          <div className="relative flex items-start">
            {/* Ligne de fond */}
            <div 
              className="absolute top-5 sm:top-[22px] left-[10%] right-[10%] h-0.5"
              style={{ backgroundColor: `${theme.textColor}10` }}
            />
            {/* Ligne de progression */}
            <div 
              className="absolute top-5 sm:top-[22px] left-[10%] h-0.5 transition-all duration-700"
              style={{ 
                backgroundColor: theme.primaryColor,
                width: currentStep >= steps.length 
                  ? '80%' 
                  : `${((currentStep - 1) / (steps.length - 1)) * 80}%`,
              }}
            />

            {/* Étapes */}
            {steps.map((step, index) => {
              const stepNumber = index + 1
              const isStepCompleted = stepNumber < currentStep
              const isStepCurrent = stepNumber === currentStep
              const isLastStepAndCompleted = stepNumber === steps.length && currentStep >= steps.length
              const StepIcon = step.icon

              return (
                <div 
                  key={step.label} 
                  className="flex-1 flex flex-col items-center relative z-10"
                >
                  {/* Icône */}
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: (isStepCompleted || isLastStepAndCompleted)
                        ? theme.primaryColor 
                        : isStepCurrent 
                          ? `${theme.primaryColor}15`
                          : theme.backgroundColor,
                      color: (isStepCompleted || isLastStepAndCompleted)
                        ? 'white' 
                        : isStepCurrent 
                          ? theme.primaryColor 
                          : `${theme.textColor}25`,
                    }}
                  >
                    {(isStepCompleted || isLastStepAndCompleted) ? (
                      <CheckCircle size={18} />
                    ) : (
                      <StepIcon size={16} />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span 
                    className="text-[9px] sm:text-[10px] mt-1.5 text-center leading-tight"
                    style={{ 
                      color: (isStepCurrent || isLastStepAndCompleted)
                        ? theme.primaryColor 
                        : isStepCompleted 
                          ? theme.textColor 
                          : `${theme.textColor}35`,
                      fontWeight: (isStepCurrent || isLastStepAndCompleted) ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Mise à jour */}
          {showLastUpdated && lastUpdated && (
            <p className="text-center text-[10px] sm:text-xs mt-4 opacity-35" style={{ color: theme.textColor }}>
              Mis à jour à {formatTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
