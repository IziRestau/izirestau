'use client'

import { Clock, CheckCircle, ChefHat, Package, Truck, XCircle, RefreshCw, Copy, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { StoreThemeData, StoreRestaurantData } from '../../../_types'

const ORDER_STATUS_CONFIG = {
  PENDING: { 
    label: 'En attente de confirmation', 
    description: 'Votre commande a été reçue et sera bientôt confirmée',
    icon: Clock, 
  },
  CONFIRMED: { 
    label: 'Commande confirmée', 
    description: 'Le restaurant a accepté votre commande',
    icon: CheckCircle, 
  },
  PREPARING: { 
    label: 'En préparation', 
    description: 'Le chef prépare votre commande avec soin',
    icon: ChefHat, 
  },
  READY: { 
    label: 'Prête à récupérer', 
    description: 'Votre commande vous attend au comptoir',
    icon: Package, 
  },
  OUT_FOR_DELIVERY: { 
    label: 'En cours de livraison', 
    description: 'Votre livreur est en route vers vous',
    icon: Truck, 
  },
  DELIVERED: { 
    label: 'Livrée', 
    description: 'Votre commande a été livrée. Bon appétit !',
    icon: CheckCircle, 
  },
  PICKED_UP: { 
    label: 'Récupérée', 
    description: 'Vous avez récupéré votre commande. Bon appétit !',
    icon: CheckCircle, 
  },
  COMPLETED: { 
    label: 'Terminée', 
    description: 'Merci pour votre commande. À bientôt !',
    icon: CheckCircle, 
  },
  CANCELLED: { 
    label: 'Annulée', 
    description: 'Cette commande a été annulée',
    icon: XCircle, 
  },
}

interface TrackHeaderSectionProps {
  theme: StoreThemeData
  restaurant: StoreRestaurantData
  subdomain: string
  order: {
    orderNumber: string
    displayNumber: string
    status: string
    estimatedTime: number
  }
  onRefresh: () => void
  isRefreshing: boolean
  sectionData?: Record<string, unknown>
}

export function TrackHeaderSection({
  theme,
  restaurant,
  subdomain,
  order,
  onRefresh,
  isRefreshing,
  sectionData,
}: TrackHeaderSectionProps) {
  const [copied, setCopied] = useState(false)

  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const bgType = (s('bgType', 'image') as string)
  const overlayOpacity = (s('overlayOpacity', theme.heroOverlayOpacity) as number) ?? 60
  const minHeight = (s('minHeight', '40vh') as string)
  const showBackButton = s('showBackButton', true) !== false
  const backButtonText = (s('backButtonText', 'Menu') as string)
  const showRefreshButton = s('showRefreshButton', true) !== false
  const showEstimatedTime = s('showEstimatedTime', true) !== false
  const showOrderNumber = s('showOrderNumber', true) !== false
  const showCopyButton = s('showCopyButton', true) !== false

  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon
  const isCancelled = order.status === 'CANCELLED'
  const isCompleted = ['DELIVERED', 'COMPLETED', 'PICKED_UP'].includes(order.status)

  const isFloatingHeader = theme.headerDesign === 'floating'

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.displayNumber || order.orderNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderBackground = () => {
    if (bgType === 'gradient') {
      const from = (s('gradientFrom') as string) || theme.primaryColor
      const to = (s('gradientTo') as string) || theme.secondaryColor
      return (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
      )
    }

    if (bgType === 'none') return null

    const bgImage = (s('bgImage') as string) || restaurant.coverImage
    if (bgImage) {
      return (
        <div className="absolute inset-0">
          <img src={bgImage} alt={restaurant.name} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity / 100}), rgba(0,0,0,0.7))`,
            }}
          />
        </div>
      )
    }

    return (
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} />
    )
  }

  // Layout sans fond (bgType === 'none')
  if (bgType === 'none') {
    return (
      <section className={`py-10 sm:py-14 ${isFloatingHeader ? 'pt-24 sm:pt-28' : ''}`} style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            {showBackButton ? (
              <Link 
                href={`/store/${subdomain}/menu`}
                className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">{backButtonText}</span>
              </Link>
            ) : <div />}
            
            {showRefreshButton && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${btnClass}`}
                style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                Actualiser
              </button>
            )}
          </div>

          {/* Status principal */}
          <div className="text-center">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4"
              style={{ backgroundColor: `${theme.primaryColor}15` }}
            >
              <StatusIcon size={40} style={{ color: theme.primaryColor }} className={isCancelled ? '' : 'animate-pulse'} />
            </div>
            <h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {statusConfig.label}
            </h1>
            <p 
              className="text-sm sm:text-base max-w-md mx-auto opacity-70"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.textColor }}
            >
              {statusConfig.description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {showOrderNumber && (
              showCopyButton ? (
                <button
                  onClick={copyOrderNumber}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${btnClass}`}
                  style={{ backgroundColor: `${theme.textColor}08`, color: theme.textColor }}
                >
                  <span className="opacity-60">Commande</span>
                  <span className="font-mono font-bold">#{order.displayNumber || order.orderNumber}</span>
                  {copied ? <Check size={14} style={{ color: theme.primaryColor }} /> : <Copy size={14} className="opacity-40" />}
                </button>
              ) : (
                <span 
                  className={`px-4 py-2 text-sm ${btnClass}`}
                  style={{ backgroundColor: `${theme.textColor}08`, color: theme.textColor }}
                >
                  <span className="opacity-60">Commande</span>{' '}
                  <span className="font-mono font-bold">#{order.displayNumber || order.orderNumber}</span>
                </span>
              )
            )}

            {showEstimatedTime && !isCompleted && !isCancelled && (
              <span 
                className={`flex items-center gap-2 px-4 py-2 text-sm ${btnClass}`}
                style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
              >
                <Clock size={16} />
                <span className="font-bold">{order.estimatedTime} min</span>
              </span>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Layout avec fond (image ou gradient)
  return (
    <section className="relative overflow-hidden" style={{ minHeight }}>
      {renderBackground()}

      <div
        className={`relative z-10 flex flex-col justify-center ${isFloatingHeader ? 'pt-20' : ''}`}
        style={{ minHeight }}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            {showBackButton ? (
              <Link 
                href={`/store/${subdomain}/menu`}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">{backButtonText}</span>
              </Link>
            ) : <div />}
            
            {showRefreshButton && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-sm text-white ${btnClass}`}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                Actualiser
              </button>
            )}
          </div>

          {/* Status principal */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <StatusIcon size={40} className={`text-white ${isCancelled ? '' : 'animate-pulse'}`} />
            </div>
            <h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
            >
              {statusConfig.label}
            </h1>
            <p 
              className="text-white/80 text-sm sm:text-base max-w-md mx-auto"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
            >
              {statusConfig.description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {showOrderNumber && (
              showCopyButton ? (
                <button
                  onClick={copyOrderNumber}
                  className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm transition-colors ${btnClass}`}
                >
                  <span className="text-white/60">Commande</span>
                  <span className="font-mono font-bold">#{order.displayNumber || order.orderNumber}</span>
                  {copied ? <Check size={14} /> : <Copy size={14} className="text-white/60" />}
                </button>
              ) : (
                <span className={`px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm ${btnClass}`}>
                  <span className="text-white/60">Commande</span>{' '}
                  <span className="font-mono font-bold">#{order.displayNumber || order.orderNumber}</span>
                </span>
              )
            )}

            {showEstimatedTime && !isCompleted && !isCancelled && (
              <span className={`flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm ${btnClass}`}>
                <Clock size={16} />
                <span className="font-bold">{order.estimatedTime} min</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
