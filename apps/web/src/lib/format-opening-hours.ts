/**
 * Formateur intelligent pour les horaires d'ouverture
 * Détecte les patterns et génère des descriptions concises
 */

interface OpeningHourSlot {
  openTime: string
  closeTime: string
}

interface OpeningHour {
  dayOfWeek: number
  isOpen: boolean
  slots: OpeningHourSlot[]
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * Formate un créneau horaire
 */
function formatSlot(slot: OpeningHourSlot): string {
  return `${slot.openTime} – ${slot.closeTime}`
}

/**
 * Génère une clé unique pour un jour basée sur ses horaires
 */
function getDayKey(day: OpeningHour): string {
  if (!day.isOpen || day.slots.length === 0) {
    return 'CLOSED'
  }
  return day.slots.map(s => `${s.openTime}-${s.closeTime}`).join('|')
}

/**
 * Formate une plage de jours consécutifs
 */
function formatDayRange(startDay: number, endDay: number): string {
  if (startDay === endDay) {
    return DAY_NAMES[startDay]
  }
  return `${DAY_NAMES[startDay]}–${DAY_NAMES[endDay]}`
}

/**
 * Formate les horaires d'ouverture de manière intelligente
 * 
 * Exemples de sortie :
 * - "Tous les jours: 11:00 – 22:00"
 * - "Tous les jours sauf Ven: 11:00 – 22:00"
 * - "Lun–Ven: 11:00 – 22:00"
 * - "Lun–Jeu: 11:00 – 22:00, Ven–Sam: 11:00 – 23:00"
 */
export function formatOpeningHours(openingHours: OpeningHour[]): string[] {
  if (!openingHours || openingHours.length === 0) {
    return []
  }

  // Trier par jour de la semaine (Lun = 1 en premier, Dim = 0 en dernier)
  const sorted = [...openingHours].sort((a, b) => {
    const aDay = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
    const bDay = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
    return aDay - bDay
  })

  // Grouper les jours par horaires identiques
  const groups: Map<string, number[]> = new Map()
  
  for (const day of sorted) {
    const key = getDayKey(day)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(day.dayOfWeek)
  }

  // Vérifier si tous les jours ont les mêmes horaires
  const openDays = sorted.filter(d => d.isOpen && d.slots.length > 0)
  const closedDays = sorted.filter(d => !d.isOpen || d.slots.length === 0)
  
  if (openDays.length === 7) {
    // Tous les jours ouverts
    const firstKey = getDayKey(openDays[0])
    const allSame = openDays.every(d => getDayKey(d) === firstKey)
    
    if (allSame) {
      const slots = openDays[0].slots.map(formatSlot).join(', ')
      return [`Tous les jours: ${slots}`]
    }
  }

  if (openDays.length === 6 && closedDays.length === 1) {
    // Tous les jours sauf un
    const firstKey = getDayKey(openDays[0])
    const allSame = openDays.every(d => getDayKey(d) === firstKey)
    
    if (allSame) {
      const closedDay = DAY_NAMES[closedDays[0].dayOfWeek]
      const slots = openDays[0].slots.map(formatSlot).join(', ')
      return [
        `Tous les jours sauf ${closedDay}: ${slots}`,
        `${closedDay}: Fermé`
      ]
    }
  }

  if (openDays.length >= 5 && closedDays.length === 2) {
    // Tous les jours sauf deux
    const firstKey = getDayKey(openDays[0])
    const allSame = openDays.every(d => getDayKey(d) === firstKey)
    
    if (allSame) {
      const closedDayNames = closedDays.map(d => DAY_NAMES[d.dayOfWeek]).join(' et ')
      const slots = openDays[0].slots.map(formatSlot).join(', ')
      return [
        `Tous les jours sauf ${closedDayNames}: ${slots}`,
        `${closedDayNames}: Fermé`
      ]
    }
  }

  // Regrouper les jours consécutifs avec mêmes horaires
  const lines: string[] = []
  
  groups.forEach((days, key) => {
    if (key === 'CLOSED') {
      // Gérer les jours fermés
      const ranges = findConsecutiveRanges(days)
      for (const range of ranges) {
        lines.push(`${formatDayRange(range.start, range.end)}: Fermé`)
      }
    } else {
      // Trouver les plages consécutives
      const ranges = findConsecutiveRanges(days)
      const daySlots = sorted.find(d => getDayKey(d) === key)!.slots
      const slotsStr = daySlots.map(formatSlot).join(', ')
      
      for (const range of ranges) {
        lines.push(`${formatDayRange(range.start, range.end)}: ${slotsStr}`)
      }
    }
  })

  // Trier les lignes par jour de début
  return lines.sort((a, b) => {
    const dayA = DAY_NAMES.findIndex(d => a.startsWith(d))
    const dayB = DAY_NAMES.findIndex(d => b.startsWith(d))
    if (a.startsWith('Tous')) return -1
    if (b.startsWith('Tous')) return 1
    const orderA = dayA === 0 ? 7 : dayA
    const orderB = dayB === 0 ? 7 : dayB
    return orderA - orderB
  })
}

/**
 * Trouve les plages de jours consécutifs
 */
function findConsecutiveRanges(days: number[]): { start: number; end: number }[] {
  if (days.length === 0) return []
  
  // Convertir en ordre de semaine (Lun=1 premier, Dim=0 dernier comme 7)
  const ordered = days.map(d => d === 0 ? 7 : d).sort((a, b) => a - b)
  
  const ranges: { start: number; end: number }[] = []
  let rangeStart = ordered[0]
  let rangeEnd = ordered[0]
  
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i] === rangeEnd + 1) {
      rangeEnd = ordered[i]
    } else {
      ranges.push({ 
        start: rangeStart === 7 ? 0 : rangeStart, 
        end: rangeEnd === 7 ? 0 : rangeEnd 
      })
      rangeStart = ordered[i]
      rangeEnd = ordered[i]
    }
  }
  
  ranges.push({ 
    start: rangeStart === 7 ? 0 : rangeStart, 
    end: rangeEnd === 7 ? 0 : rangeEnd 
  })
  
  return ranges
}

/**
 * Version simple : liste tous les jours individuellement
 */
export function formatOpeningHoursSimple(openingHours: OpeningHour[]): string[] {
  if (!openingHours || openingHours.length === 0) {
    return []
  }

  const sorted = [...openingHours].sort((a, b) => {
    const aDay = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
    const bDay = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
    return aDay - bDay
  })

  return sorted.map(day => {
    const dayName = DAY_NAMES[day.dayOfWeek]
    if (!day.isOpen || day.slots.length === 0) {
      return `${dayName}: Fermé`
    }
    const slotsStr = day.slots.map(formatSlot).join(', ')
    return `${dayName}: ${slotsStr}`
  })
}
