'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import {
  Armchair,
  Award,
  Baby,
  BadgeCheck,
  Banknote,
  Beef,
  Beer,
  Bell,
  BellRing,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Cake,
  CakeSlice,
  Calendar,
  Camera,
  Candy,
  Car,
  Check,
  ChefHat,
  Cherry,
  CircleDollarSign,
  Citrus,
  Clock,
  CloudSun,
  Coffee,
  Compass,
  ConciergeBell,
  Cookie,
  CookingPot,
  CreditCard,
  Croissant,
  Crown,
  Dessert,
  DollarSign,
  Droplet,
  Drumstick,
  Egg,
  Fan,
  Fish,
  Flag,
  Flame,
  FlameKindling,
  Flower2,
  Gem,
  Gift,
  GlassWater,
  Globe,
  GraduationCap,
  Grape,
  HeartHandshake,
  Heart,
  Home,
  Hotel,
  Hourglass,
  IceCream2,
  Key,
  Lamp,
  Languages,
  Laugh,
  Leaf,
  Lightbulb,
  MapPin,
  Medal,
  MessageCircle,
  Mic,
  Microwave,
  Milk,
  Moon,
  Mountain,
  Music,
  Nut,
  Package,
  Palette,
  Percent,
  PersonStanding,
  Phone,
  PiggyBank,
  Pizza,
  Popcorn,
  Rainbow,
  Receipt,
  Refrigerator,
  Rocket,
  Salad,
  Sandwich,
  Scale,
  Shield,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Smartphone,
  Smile,
  Snowflake,
  Sofa,
  Soup,
  Sparkles,
  Sprout,
  Star,
  Store,
  Sun,
  Sunrise,
  Table,
  Tag,
  Target,
  Tent,
  Thermometer,
  ThumbsUp,
  Ticket,
  Timer,
  Train,
  TreePine,
  Trophy,
  Truck,
  Umbrella,
  Users2,
  Utensils,
  UtensilsCrossed,
  Vegan,
  Wallet,
  Watch,
  Waves,
  Wheat,
  Wifi,
  Wind,
  Wine,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface IconEntry {
  name: string
  icon: LucideIcon
  keywords: string[]
}

const ALL_ICONS: IconEntry[] = [
  // Cuisine & Aliments
  { name: 'Utensils', icon: Utensils, keywords: ['couverts', 'restaurant', 'manger'] },
  { name: 'UtensilsCrossed', icon: UtensilsCrossed, keywords: ['couverts', 'croisés'] },
  { name: 'ChefHat', icon: ChefHat, keywords: ['chef', 'cuisinier', 'toque'] },
  { name: 'CookingPot', icon: CookingPot, keywords: ['casserole', 'cuisson', 'marmite'] },
  { name: 'ConciergeBell', icon: ConciergeBell, keywords: ['service', 'serveur', 'cloche'] },
  { name: 'Pizza', icon: Pizza, keywords: ['pizza', 'italien'] },
  { name: 'Sandwich', icon: Sandwich, keywords: ['sandwich', 'burger'] },
  { name: 'Beef', icon: Beef, keywords: ['viande', 'boeuf', 'steak'] },
  { name: 'Drumstick', icon: Drumstick, keywords: ['poulet', 'volaille'] },
  { name: 'Fish', icon: Fish, keywords: ['poisson', 'fruits de mer'] },
  { name: 'Egg', icon: Egg, keywords: ['oeuf', 'brunch'] },
  { name: 'Salad', icon: Salad, keywords: ['salade', 'légumes', 'healthy'] },
  { name: 'Soup', icon: Soup, keywords: ['soupe', 'bouillon'] },
  { name: 'Cake', icon: Cake, keywords: ['gâteau', 'dessert', 'pâtisserie'] },
  { name: 'CakeSlice', icon: CakeSlice, keywords: ['part', 'gâteau', 'tranche'] },
  { name: 'Dessert', icon: Dessert, keywords: ['dessert', 'sucré'] },
  { name: 'IceCream2', icon: IceCream2, keywords: ['glace', 'crème glacée'] },
  { name: 'Croissant', icon: Croissant, keywords: ['croissant', 'viennoiserie', 'boulangerie'] },
  { name: 'Cookie', icon: Cookie, keywords: ['cookie', 'biscuit', 'goûter'] },
  { name: 'Candy', icon: Candy, keywords: ['bonbon', 'confiserie', 'sucré'] },
  { name: 'Popcorn', icon: Popcorn, keywords: ['popcorn', 'snack'] },
  { name: 'Cherry', icon: Cherry, keywords: ['cerise', 'fruit'] },
  { name: 'Citrus', icon: Citrus, keywords: ['citron', 'agrume', 'orange'] },
  { name: 'Grape', icon: Grape, keywords: ['raisin', 'fruit'] },
  { name: 'Nut', icon: Nut, keywords: ['noix', 'noisette'] },
  { name: 'Wheat', icon: Wheat, keywords: ['blé', 'céréale', 'pain'] },
  { name: 'Sprout', icon: Sprout, keywords: ['pousse', 'germé', 'frais'] },
  { name: 'Microwave', icon: Microwave, keywords: ['micro-ondes', 'réchauffer'] },
  { name: 'Refrigerator', icon: Refrigerator, keywords: ['réfrigérateur', 'frais'] },
  { name: 'Thermometer', icon: Thermometer, keywords: ['température', 'chaud', 'froid'] },

  // Boissons
  { name: 'Coffee', icon: Coffee, keywords: ['café', 'boisson chaude'] },
  { name: 'Wine', icon: Wine, keywords: ['vin', 'alcool', 'verre'] },
  { name: 'Beer', icon: Beer, keywords: ['bière', 'alcool'] },
  { name: 'Milk', icon: Milk, keywords: ['lait', 'boisson'] },
  { name: 'GlassWater', icon: GlassWater, keywords: ['eau', 'verre', 'boisson'] },
  { name: 'Droplet', icon: Droplet, keywords: ['goutte', 'eau', 'frais'] },

  // Service & Livraison
  { name: 'Truck', icon: Truck, keywords: ['livraison', 'camion'] },
  { name: 'Bike', icon: Bike, keywords: ['vélo', 'livraison'] },
  { name: 'Car', icon: Car, keywords: ['voiture', 'drive'] },
  { name: 'Bus', icon: Bus, keywords: ['bus', 'transport'] },
  { name: 'Train', icon: Train, keywords: ['train', 'transport', 'gare'] },
  { name: 'Ship', icon: Ship, keywords: ['bateau', 'port', 'maritime'] },
  { name: 'Package', icon: Package, keywords: ['colis', 'emporter'] },
  { name: 'ShoppingBag', icon: ShoppingBag, keywords: ['sac', 'commande'] },
  { name: 'Receipt', icon: Receipt, keywords: ['reçu', 'ticket', 'facture'] },
  { name: 'Phone', icon: Phone, keywords: ['téléphone', 'appel'] },
  { name: 'Smartphone', icon: Smartphone, keywords: ['mobile', 'application'] },
  { name: 'Clock', icon: Clock, keywords: ['horloge', 'temps', 'horaires'] },
  { name: 'Timer', icon: Timer, keywords: ['minuteur', 'rapide'] },
  { name: 'Hourglass', icon: Hourglass, keywords: ['sablier', 'attente', 'patience'] },
  { name: 'Watch', icon: Watch, keywords: ['montre', 'ponctualité'] },
  { name: 'Calendar', icon: Calendar, keywords: ['calendrier', 'réservation'] },
  { name: 'MapPin', icon: MapPin, keywords: ['localisation', 'adresse'] },
  { name: 'Compass', icon: Compass, keywords: ['boussole', 'direction'] },
  { name: 'Bell', icon: Bell, keywords: ['cloche', 'notification'] },
  { name: 'BellRing', icon: BellRing, keywords: ['cloche', 'alerte', 'sonnerie'] },
  { name: 'MessageCircle', icon: MessageCircle, keywords: ['message', 'chat', 'avis'] },
  { name: 'Tag', icon: Tag, keywords: ['étiquette', 'prix', 'promotion'] },
  { name: 'Ticket', icon: Ticket, keywords: ['ticket', 'entrée', 'événement'] },
  { name: 'CreditCard', icon: CreditCard, keywords: ['carte', 'paiement', 'bancaire'] },
  { name: 'Banknote', icon: Banknote, keywords: ['billet', 'argent', 'espèces'] },
  { name: 'Percent', icon: Percent, keywords: ['pourcentage', 'réduction', 'promo'] },
  { name: 'Store', icon: Store, keywords: ['magasin', 'boutique', 'commerce'] },

  // Qualité & Valeurs
  { name: 'Star', icon: Star, keywords: ['étoile', 'qualité', 'avis'] },
  { name: 'Heart', icon: Heart, keywords: ['coeur', 'favori', 'amour'] },
  { name: 'HeartHandshake', icon: HeartHandshake, keywords: ['confiance', 'partenariat', 'engagement'] },
  { name: 'ThumbsUp', icon: ThumbsUp, keywords: ['pouce', 'approuvé', 'bien'] },
  { name: 'Award', icon: Award, keywords: ['prix', 'récompense'] },
  { name: 'Trophy', icon: Trophy, keywords: ['trophée', 'champion'] },
  { name: 'Medal', icon: Medal, keywords: ['médaille', 'distinction'] },
  { name: 'Crown', icon: Crown, keywords: ['couronne', 'premium'] },
  { name: 'Gem', icon: Gem, keywords: ['diamant', 'précieux', 'luxe'] },
  { name: 'Shield', icon: Shield, keywords: ['bouclier', 'sécurité', 'confiance'] },
  { name: 'ShieldCheck', icon: ShieldCheck, keywords: ['sécurité', 'vérifié', 'certifié'] },
  { name: 'BadgeCheck', icon: BadgeCheck, keywords: ['badge', 'vérifié', 'certifié'] },
  { name: 'Check', icon: Check, keywords: ['validé', 'vérifié'] },
  { name: 'Leaf', icon: Leaf, keywords: ['feuille', 'bio', 'naturel'] },
  { name: 'Vegan', icon: Vegan, keywords: ['vegan', 'végétal'] },
  { name: 'Flame', icon: Flame, keywords: ['flamme', 'chaud', 'populaire'] },
  { name: 'FlameKindling', icon: FlameKindling, keywords: ['feu', 'braise', 'grill'] },
  { name: 'Zap', icon: Zap, keywords: ['éclair', 'rapide', 'énergie'] },
  { name: 'Sparkles', icon: Sparkles, keywords: ['étincelles', 'nouveau', 'spécial'] },
  { name: 'Target', icon: Target, keywords: ['cible', 'objectif', 'précision'] },
  { name: 'Rocket', icon: Rocket, keywords: ['fusée', 'lancement', 'innovation'] },
  { name: 'Lightbulb', icon: Lightbulb, keywords: ['ampoule', 'idée', 'innovation'] },

  // Ambiance & Lieu
  { name: 'Smile', icon: Smile, keywords: ['sourire', 'satisfaction', 'client'] },
  { name: 'Laugh', icon: Laugh, keywords: ['rire', 'joie', 'heureux'] },
  { name: 'Baby', icon: Baby, keywords: ['bébé', 'enfant', 'famille'] },
  { name: 'PersonStanding', icon: PersonStanding, keywords: ['personne', 'debout', 'accueil'] },
  { name: 'Users2', icon: Users2, keywords: ['utilisateurs', 'partenariat', 'équipe'] },
  { name: 'Briefcase', icon: Briefcase, keywords: ['business', 'professionnel'] },
  { name: 'GraduationCap', icon: GraduationCap, keywords: ['diplôme', 'formation', 'expertise'] },
  { name: 'Building2', icon: Building2, keywords: ['bâtiment', 'établissement'] },
  { name: 'Home', icon: Home, keywords: ['maison', 'domicile', 'chez soi'] },
  { name: 'Hotel', icon: Hotel, keywords: ['hôtel', 'hébergement', 'séjour'] },
  { name: 'Tent', icon: Tent, keywords: ['tente', 'camping', 'plein air'] },
  { name: 'Armchair', icon: Armchair, keywords: ['fauteuil', 'confort', 'salon'] },
  { name: 'Sofa', icon: Sofa, keywords: ['canapé', 'lounge', 'détente'] },
  { name: 'Table', icon: Table, keywords: ['table', 'couvert', 'salle'] },
  { name: 'Lamp', icon: Lamp, keywords: ['lampe', 'éclairage', 'ambiance'] },
  { name: 'Fan', icon: Fan, keywords: ['ventilateur', 'climatisation', 'frais'] },
  { name: 'Key', icon: Key, keywords: ['clé', 'accès', 'privé'] },
  { name: 'BookOpen', icon: BookOpen, keywords: ['livre', 'menu', 'carte'] },
  { name: 'Camera', icon: Camera, keywords: ['photo', 'souvenir', 'instagram'] },
  { name: 'Mic', icon: Mic, keywords: ['micro', 'karaoké', 'événement'] },
  { name: 'Music', icon: Music, keywords: ['musique', 'ambiance'] },
  { name: 'Languages', icon: Languages, keywords: ['langues', 'multilingue', 'international'] },

  // Nature & Météo
  { name: 'Sun', icon: Sun, keywords: ['soleil', 'terrasse'] },
  { name: 'Sunrise', icon: Sunrise, keywords: ['lever de soleil', 'matin'] },
  { name: 'Moon', icon: Moon, keywords: ['lune', 'nuit', 'soirée'] },
  { name: 'CloudSun', icon: CloudSun, keywords: ['nuage', 'soleil', 'météo'] },
  { name: 'Snowflake', icon: Snowflake, keywords: ['flocon', 'hiver', 'glacé'] },
  { name: 'Wind', icon: Wind, keywords: ['vent', 'aéré', 'frais'] },
  { name: 'Waves', icon: Waves, keywords: ['vagues', 'mer', 'océan'] },
  { name: 'Rainbow', icon: Rainbow, keywords: ['arc-en-ciel', 'couleurs', 'diversité'] },
  { name: 'Umbrella', icon: Umbrella, keywords: ['parapluie', 'pluie', 'protection'] },
  { name: 'Mountain', icon: Mountain, keywords: ['montagne', 'nature'] },
  { name: 'TreePine', icon: TreePine, keywords: ['sapin', 'forêt', 'nature'] },
  { name: 'Flower2', icon: Flower2, keywords: ['fleur', 'décoration'] },

  // Divers
  { name: 'Globe', icon: Globe, keywords: ['monde', 'international'] },
  { name: 'Flag', icon: Flag, keywords: ['drapeau', 'pays'] },
  { name: 'Palette', icon: Palette, keywords: ['palette', 'créatif', 'art'] },
  { name: 'Gift', icon: Gift, keywords: ['cadeau', 'offre'] },
  { name: 'Wallet', icon: Wallet, keywords: ['portefeuille', 'prix', 'argent'] },
  { name: 'PiggyBank', icon: PiggyBank, keywords: ['tirelire', 'économies', 'épargne'] },
  { name: 'CircleDollarSign', icon: CircleDollarSign, keywords: ['dollar', 'prix', 'économique'] },
  { name: 'DollarSign', icon: DollarSign, keywords: ['dollar', 'argent', 'monnaie'] },
  { name: 'Scale', icon: Scale, keywords: ['balance', 'équilibre'] },
  { name: 'Wifi', icon: Wifi, keywords: ['wifi', 'internet', 'connexion'] },
  { name: 'Wrench', icon: Wrench, keywords: ['clé', 'outil', 'réparation'] },
]

export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ALL_ICONS.map((i) => [i.name, i.icon])
)

export function getIconComponent(name: string | undefined | null): LucideIcon | null {
  if (!name) return null
  return ICON_MAP[name] || null
}

interface IconPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (iconName: string) => void
  value: string | null | undefined
  primaryColor?: string
}

function IconPickerModal({
  isOpen,
  onClose,
  onSelect,
  value,
  primaryColor = '#10b981',
}: IconPickerModalProps) {
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) setSearch('')
  }, [isOpen])

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return ALL_ICONS
    const q = search.toLowerCase()
    return ALL_ICONS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.keywords.some((k) => k.includes(q))
    )
  }, [search])

  const content = (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une icone..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:bg-white focus:border-gray-300 transition-colors"
            style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
            autoFocus={!isMobile}
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{filteredIcons.length} icones</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Search size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucune icone trouvée</p>
            <p className="text-[11px] text-gray-300 mt-1">Essayez un autre mot-clé</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            {filteredIcons.map((item) => {
              const Icon = item.icon
              const isSelected = value === item.name
              return (
                <button
                  key={item.name}
                  type="button"
                  title={item.keywords[0] || item.name}
                  onClick={() => {
                    onSelect(item.name)
                    onClose()
                  }}
                  className={cn(
                    'aspect-square rounded-xl flex items-center justify-center transition-all',
                    isSelected
                      ? 'ring-2 shadow-sm scale-110'
                      : 'hover:bg-gray-100 hover:scale-105'
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                          '--tw-ring-color': `${primaryColor}50`,
                        } as React.CSSProperties
                      : { color: '#6b7280' }
                  }
                >
                  <Icon size={20} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden">
          <DrawerHeader className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DrawerTitle>Choisir une icone</DrawerTitle>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl h-[70vh] p-0 flex flex-col overflow-hidden [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Choisir une icone</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

interface IconPickerProps {
  value: string | null | undefined
  onChange: (iconName: string | null) => void
  label?: string
  description?: string
  primaryColor?: string
  disabled?: boolean
}

export function IconPicker({
  value,
  onChange,
  label,
  description,
  primaryColor = '#10b981',
  disabled = false,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const SelectedIcon = value ? getIconComponent(value) : null

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs font-medium text-gray-700">{label}</Label>}
      {description && <p className="text-[11px] text-gray-400">{description}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center gap-2.5 flex-1 px-3 py-2.5 rounded-xl border text-sm transition-colors border-gray-200 hover:border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {SelectedIcon ? (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <SelectedIcon size={18} style={{ color: primaryColor }} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Search size={14} className="text-gray-400" />
            </div>
          )}
          <span className={cn('flex-1 text-left', value ? 'text-gray-900' : 'text-gray-400')}>
            {value || 'Choisir une icone'}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <IconPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(name) => onChange(name)}
        value={value}
        primaryColor={primaryColor}
      />
    </div>
  )
}
