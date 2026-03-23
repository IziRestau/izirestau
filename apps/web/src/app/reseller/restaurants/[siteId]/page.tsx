'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { InvoiceDetailModal } from '@/components/shared/InvoiceDetailModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { resellerNavigation } from '@/config/reseller-navigation'
import { useResellerSiteDetails } from '@/hooks/use-reseller'
import { useResellerCurrency } from '@/hooks/use-currency'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Store,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Power,
  Loader2,
  Copy,
  User,
  Building2,
  ShoppingBag,
  TrendingUp,
  Users,
  Eye,
  CreditCard,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Key,
  Trash2,
  Edit3,
  Save,
  X,
  MoreVertical,
  Send,
  Plus,
  Banknote,
  Wallet,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PaymentModal } from '@/components/reseller/PaymentModal'

export default function SiteDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.siteId as string
  
  const { accessToken } = useAuthStore()
  const { data: site, isLoading, refetch } = useResellerSiteDetails(siteId)
  const { format: formatAmount, currency } = useResellerCurrency()
  
  const [statusConfirm, setStatusConfirm] = useState<{ action: 'activate' | 'suspend' } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isResendingAccess, setIsResendingAccess] = useState(false)
  const [resendAccessConfirm, setResendAccessConfirm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [clientNotes, setClientNotes] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [reminderConfirm, setReminderConfirm] = useState<{ invoiceId: string; invoiceNumber: string; clientEmail: string } | null>(null)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cancelSubConfirm, setCancelSubConfirm] = useState<{ id: string; name: string } | null>(null)
  const [isCancelingSub, setIsCancelingSub] = useState(false)
  const queryClient = useQueryClient()

  const handleStatusChange = async () => {
    if (!statusConfirm || !site) return
    
    setIsUpdating(true)
    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const newStatus = statusConfirm.action === 'activate' ? 'ACTIVE' : 'SUSPENDED'
      await api.reseller.updateSiteStatus(site.id, newStatus)
      toast.success(statusConfirm.action === 'activate' ? 'Site active' : 'Site suspendu')
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    } finally {
      setIsUpdating(false)
      setStatusConfirm(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copie dans le presse-papier')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Actif</span>
      case 'SUSPENDED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspendu</span>
      case 'DRAFT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Brouillon</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Payee</span>
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">En attente</span>
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">En retard</span>
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
    }
  }

  const handleDeleteSite = async () => {
    if (!site) return
    
    setIsDeleting(true)
    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await api.reseller.deleteClient(site.client?.id || '')
      toast.success('Site supprime')
      router.push('/reseller/restaurants')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!site?.client) return
    
    setIsSavingNotes(true)
    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await api.reseller.updateClientNotes(site.client.id, clientNotes)
      toast.success('Notes enregistrees')
      setIsEditingNotes(false)
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleResendAccess = async () => {
    if (!site) return
    
    setIsResendingAccess(true)
    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const result = await api.reseller.resendAccess(site.id)
      toast.success(`Lien envoye a ${result.data?.email || site.restaurant?.email}`)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi')
    } finally {
      setIsResendingAccess(false)
    }
  }

  const handleAddNote = async () => {
    if (!site?.client || !noteContent.trim()) return
    
    setIsAddingNote(true)
    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await api.reseller.addClientNote(site.client.id, noteContent.trim())
      toast.success('Note ajoutee')
      setNoteContent('')
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout')
    } finally {
      setIsAddingNote(false)
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'NOTE': return MessageSquare
      case 'CALL': return Phone
      case 'EMAIL': return Mail
      case 'MEETING': return Users
      default: return MessageSquare
    }
  }

  const handleSendInvoiceReminder = async () => {
    if (!reminderConfirm) return
    
    setIsSendingReminder(true)
    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const result = await api.reseller.sendInvoiceReminder(reminderConfirm.invoiceId)
      toast.success(`Relance envoyee a ${(result as any).data?.clientEmail || reminderConfirm.clientEmail}`)
      setReminderConfirm(null)
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi de la relance')
    } finally {
      setIsSendingReminder(false)
    }
  }

  const openReminderConfirm = (invoice: any) => {
    setReminderConfirm({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientEmail: site?.client?.email || ''
    })
  }

  // Query pour les paiements du client
  const { data: paymentsData } = useQuery({
    queryKey: ['client-payments', site?.client?.id],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.reseller.getClientPayments(site?.client?.id || '')
    },
    enabled: !!accessToken && !!site?.client?.id,
  })

  const payments = paymentsData?.data || []

  // Mutation pour créer un paiement
  const createPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; method: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CARD' | 'OTHER'; reference?: string; notes?: string; invoiceId?: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.reseller.createClientPayment(site?.client?.id || '', data)
    },
    onSuccess: () => {
      toast.success('Paiement enregistre')
      setShowPaymentModal(false)
      queryClient.invalidateQueries({ queryKey: ['client-payments', site?.client?.id] })
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement')
    },
  })

  const handleCreatePayment = async (data: { amount: number; method: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CARD' | 'OTHER'; reference?: string; notes?: string; invoiceId?: string }) => {
    await createPaymentMutation.mutateAsync(data)
  }

  // Factures impayees pour le modal de paiement
  const unpaidInvoices = (site?.client?.invoices || [])
    .filter((inv: { status: string }) => inv.status !== 'PAID')
    .map((inv: { id: string; invoiceNumber: string; total: number; status: string }) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.total),
      status: inv.status,
      currency,
    }))

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER': return 'Virement'
      case 'CHECK': return 'Cheque'
      case 'CASH': return 'Especes'
      case 'CARD': return 'Carte'
      case 'OTHER': return 'Autre'
      default: return method
    }
  }

  if (!site && isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Chargement..."
        variant="detail"
      />
    )
  }

  if (!site) {
    return (
      <DashboardLayout
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Site non trouve"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Site non trouve</h3>
          <p className="text-gray-500 mb-6">Ce site n'existe pas ou vous n'y avez pas acces.</p>
          <button
            onClick={() => router.push('/reseller/restaurants')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour aux restaurants
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const siteUrl = site.customDomain || `${site.subdomain}.iziresto.com`

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
    >
      <PageHeader
        title={site.restaurant?.name || site.subdomain}
        subtitle="Details du restaurant"
        icon={Store}
        badge={{
          text: site.status === 'ACTIVE' ? 'Actif' : site.status === 'SUSPENDED' ? 'Suspendu' : site.status,
          variant: site.status === 'ACTIVE' ? 'success' : site.status === 'SUSPENDED' ? 'warning' : 'default'
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`https://${siteUrl}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Voir le site</span>
            </button>
            
            {/* Dropdown Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {site.status === 'ACTIVE' ? (
                  <DropdownMenuItem
                    onClick={() => setStatusConfirm({ action: 'suspend' })}
                    className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                >
                  <Power size={16} className="mr-3" />
                  <span className="text-[13px]">Suspendre le restaurant</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setStatusConfirm({ action: 'activate' })}
                  className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                >
                  <Power size={16} className="mr-3" />
                  <span className="text-[13px]">Activer le restaurant</span>
                </DropdownMenuItem>
              )}
              
              {site.restaurant && (
                <DropdownMenuItem 
                  onClick={() => setResendAccessConfirm(true)}
                  className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                >
                  <Key size={16} className="mr-3 text-gray-400" />
                  <span className="text-[13px] text-gray-700">Renvoyer les acces</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator className="my-1" />
              
              <DropdownMenuItem
                onClick={() => setDeleteConfirm(true)}
                className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
              >
                <Trash2 size={16} className="mr-3" />
                <span className="text-[13px]">Supprimer le restaurant</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Main Content Grid - 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Colonne principale (2/3) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-5">
          {/* Carte principale Restaurant */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            {/* Header avec logo et infos principales */}
            <div className="flex items-start gap-4 mb-6">
              {site.restaurant?.logo ? (
                <img 
                  src={site.restaurant.logo} 
                  alt={site.restaurant.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Store className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{site.restaurant?.name || site.subdomain}</h3>
                    {site.restaurant?.businessType && (
                      <div className="text-sm text-gray-500 capitalize">{site.restaurant.businessType.toLowerCase()}</div>
                    )}
                  </div>
                  {getStatusBadge(site.status)}
                </div>
                {site.restaurant?.cuisineTypes && site.restaurant.cuisineTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {site.restaurant.cuisineTypes.slice(0, 3).map((type, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Infos de contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {site.restaurant?.email && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500 mb-0.5">Email</div>
                    <div className="font-medium text-gray-900 truncate">{site.restaurant.email}</div>
                  </div>
                </div>
              )}
              
              {site.restaurant?.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-0.5">Telephone</div>
                    <div className="font-medium text-gray-900">{site.restaurant.phone}</div>
                  </div>
                </div>
              )}
              
              {site.restaurant?.address && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-0.5">Adresse</div>
                    <div className="font-medium text-gray-900">
                      {site.restaurant.address}
                      {site.restaurant.city && `, ${site.restaurant.postalCode} ${site.restaurant.city}`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* URL et dates */}
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-500 mb-0.5">URL</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate text-sm">{site.subdomain}.iziresto.com</span>
                      <button
                        onClick={() => copyToClipboard(`https://${siteUrl}`)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        <Copy size={12} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-0.5">Cree le</div>
                    <div className="font-medium text-gray-900 text-sm">{formatDate(site.createdAt)}</div>
                  </div>
                </div>
                
                {site.publishedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-0.5">Publie le</div>
                      <div className="font-medium text-gray-900 text-sm">{formatDate(site.publishedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Abonnement */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Abonnement</h3>
            
            {site.client?.subscriptions && site.client.subscriptions.length > 0 ? (
              site.client.subscriptions.map((sub) => {
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'ACTIVE':
                      return (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <CheckCircle size={12} />
                          Actif
                        </span>
                      )
                    case 'PAUSED':
                      return (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Clock size={12} />
                          En pause
                        </span>
                      )
                    case 'CANCELLED':
                      return (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <X size={12} />
                          Annule
                        </span>
                      )
                    default:
                      return (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <AlertCircle size={12} />
                          {status}
                        </span>
                      )
                  }
                }

                const handlePauseSubscription = async () => {
                  try {
                    if (accessToken) apiClient.setAccessToken(accessToken)
                    await api.reseller.pauseSubscription(sub.id)
                    toast.success('Abonnement mis en pause')
                    refetch()
                  } catch {
                    toast.error('Erreur lors de la mise en pause')
                  }
                }

                const handleResumeSubscription = async () => {
                  try {
                    if (accessToken) apiClient.setAccessToken(accessToken)
                    await api.reseller.resumeSubscription(sub.id)
                    toast.success('Abonnement reactive')
                    refetch()
                  } catch {
                    toast.error('Erreur lors de la reactivation')
                  }
                }

                const openCancelConfirm = () => {
                  setCancelSubConfirm({ id: sub.id, name: sub.name })
                }

                return (
                  <div key={sub.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{sub.name}</div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatAmount(Number(sub.amount))}
                          <span className="text-sm font-normal text-gray-500">/{sub.billingCycle === 'MONTHLY' ? 'mois' : 'an'}</span>
                        </div>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Debut: </span>
                        <span className="text-gray-900">{formatDate(sub.startDate)}</span>
                      </div>
                      {sub.nextBillingDate && (
                        <div>
                          <span className="text-gray-500">Prochain: </span>
                          <span className="text-gray-900">{formatDate(sub.nextBillingDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions abonnement */}
                    {sub.status !== 'CANCELLED' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={handlePauseSubscription}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Clock size={12} />
                            Mettre en pause
                          </button>
                        )}
                        {(sub.status === 'PAUSED' || sub.status === 'PAST_DUE') && (
                          <button
                            onClick={handleResumeSubscription}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <CheckCircle size={12} />
                            Reactiver
                          </button>
                        )}
                        <button
                          onClick={openCancelConfirm}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <X size={12} />
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Aucun abonnement</p>
              </div>
            )}
          </div>

          {/* Factures */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Factures</h3>
                {site.client?.invoices && site.client.invoices.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{site.client.invoices.length} facture(s)</p>
                )}
              </div>
            </div>
            
            {site.client?.invoices && site.client.invoices.length > 0 ? (
              <div className="px-6 pb-6 space-y-2">
                {site.client.invoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    className="flex items-center p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${invoice.status === 'PAID' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <FileText size={16} className={invoice.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center">
                      <div className="font-semibold text-gray-900">{formatAmount(Number(invoice.total))}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      {invoice.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <CheckCircle size={12} />
                          Payee
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <Clock size={12} />
                            En attente
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openReminderConfirm(invoice)
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 transition-colors"
                            title="Envoyer une relance"
                          >
                            <Send size={14} className="text-gray-500 hover:text-amber-600" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                        title="Voir les details"
                      >
                        <Eye size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 pb-6">
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune facture</p>
                </div>
              </div>
            )}
          </div>

          {/* Paiements manuels */}
          {site.client && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between p-6 pb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Paiements</h3>
                  {payments.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{payments.length} paiement(s)</p>
                  )}
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              </div>
              
              {payments.length > 0 ? (
                <div className="px-6 pb-6 space-y-2">
                  {payments.map((payment: { id: string; amount: number; currency: string; method: string; reference: string | null; receivedAt: string }) => (
                    <div 
                      key={payment.id}
                      className="flex items-center p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-100">
                          <Wallet size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{getPaymentMethodLabel(payment.method)}</div>
                          <div className="text-xs text-gray-500">{formatDate(payment.receivedAt)}</div>
                        </div>
                      </div>
                      
                      {payment.reference && (
                        <div className="flex-1 text-center hidden sm:block">
                          <span className="text-xs text-gray-500">Ref: {payment.reference}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-semibold text-gray-900">{formatAmount(Number(payment.amount))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 pb-6">
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Banknote size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Aucun paiement enregistre</p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 mt-2"
                    >
                      Enregistrer un paiement
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite - Client + Actions */}
        <div className="space-y-4 lg:space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Client */}
          {site.client && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Client</h3>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold">
                    {site.client.contactFirstName.charAt(0)}{site.client.contactLastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {site.client.contactFirstName} {site.client.contactLastName}
                  </div>
                  <div className="text-sm text-gray-500">{site.client.name}</div>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700 truncate">{site.client.email}</span>
                </div>
                {site.client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{site.client.phone}</span>
                  </div>
                )}
                {site.client.businessName && (
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{site.client.businessName}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Client depuis {formatDate(site.client.createdAt)}</span>
                </div>
              </div>
              
              {site.client.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <p className="text-sm text-gray-700">{site.client.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes internes */}
          {site.client && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Notes internes</h3>
                {!isEditingNotes ? (
                  <button
                    onClick={() => {
                      setClientNotes(site.client?.notes || '')
                      setIsEditingNotes(true)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} className="text-gray-500" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                    >
                      {isSavingNotes ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {isEditingNotes ? (
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Notes privees sur ce client..."
                  className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : site.client.notes ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{site.client.notes}</p>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400">Aucune note</p>
                  <button
                    onClick={() => {
                      setClientNotes('')
                      setIsEditingNotes(true)
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 mt-1"
                  >
                    Ajouter une note
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ajouter une interaction */}
          {site.client && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Nouvelle interaction</h3>
              <div className="space-y-3">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ecrire une note sur ce client..."
                  className="w-full h-20 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !noteContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isAddingNote ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Historique des interactions */}
          {site.client && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Historique</h3>
              
              {site.client.interactions && site.client.interactions.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {site.client.interactions.map((interaction) => {
                    const Icon = getInteractionIcon(interaction.type)
                    return (
                      <div key={interaction.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon size={12} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-500 uppercase">{interaction.type}</span>
                            <span className="text-xs text-gray-400">{formatDate(interaction.createdAt)}</span>
                          </div>
                          {interaction.subject && (
                            <div className="text-sm font-medium text-gray-900">{interaction.subject}</div>
                          )}
                          {interaction.content && (
                            <p className="text-xs text-gray-600 line-clamp-2">{interaction.content}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <MessageSquare size={16} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune interaction</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={handleStatusChange}
        title={statusConfirm?.action === 'activate' ? 'Activer le site' : 'Suspendre le site'}
        message={
          statusConfirm?.action === 'activate'
            ? 'Le site sera visible et accessible aux clients.'
            : 'Le site ne sera plus accessible aux clients. Vous pourrez le reactiver a tout moment.'
        }
        confirmText={statusConfirm?.action === 'activate' ? 'Activer' : 'Suspendre'}
        cancelText="Annuler"
        variant={statusConfirm?.action === 'activate' ? 'info' : 'warning'}
        isLoading={isUpdating}
      />

      <ConfirmModal
        isOpen={resendAccessConfirm}
        onClose={() => setResendAccessConfirm(false)}
        onConfirm={() => {
          setResendAccessConfirm(false)
          handleResendAccess()
        }}
        title="Renvoyer les acces"
        message={`Un email de reinitialisation de mot de passe sera envoye a ${site?.restaurant?.email || 'l\'adresse du restaurateur'}. Voulez-vous continuer ?`}
        confirmText="Envoyer"
        cancelText="Annuler"
        variant="info"
        isLoading={isResendingAccess}
      />

      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteSite}
        title="Supprimer le site"
        message={`Etes-vous sur de vouloir supprimer "${site?.restaurant?.name || site?.subdomain}" ? Cette action est irreversible et supprimera egalement le client associe.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />

      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        clientName={site?.client?.name}
        clientEmail={site?.client?.email}
        onSendReminder={async (invoiceId) => {
          const invoice = site?.client?.invoices?.find((i: any) => i.id === invoiceId)
          if (invoice) {
            setSelectedInvoice(null)
            openReminderConfirm(invoice)
          }
        }}
      />

      <ConfirmModal
        isOpen={!!reminderConfirm}
        onClose={() => setReminderConfirm(null)}
        onConfirm={handleSendInvoiceReminder}
        title="Envoyer une relance"
        message={`Un email de relance pour la facture ${reminderConfirm?.invoiceNumber || ''} sera envoye a ${reminderConfirm?.clientEmail || 'l\'adresse du client'}. Voulez-vous continuer ?`}
        confirmText="Envoyer la relance"
        cancelText="Annuler"
        variant="info"
        isLoading={isSendingReminder}
      />

      {/* Modal Nouveau Paiement */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleCreatePayment}
        isLoading={createPaymentMutation.isPending}
        clientName={site?.client?.name}
        unpaidInvoices={unpaidInvoices}
        currency={currency}
      />

      {/* Confirmation annulation abonnement */}
      <ConfirmModal
        isOpen={!!cancelSubConfirm}
        onClose={() => setCancelSubConfirm(null)}
        onConfirm={async () => {
          if (!cancelSubConfirm) return
          setIsCancelingSub(true)
          try {
            if (accessToken) apiClient.setAccessToken(accessToken)
            await api.reseller.cancelSubscription(cancelSubConfirm.id)
            toast.success('Abonnement annule')
            setCancelSubConfirm(null)
            refetch()
          } catch {
            toast.error('Erreur lors de l\'annulation')
          } finally {
            setIsCancelingSub(false)
          }
        }}
        title="Annuler l'abonnement"
        message={`Etes-vous sur de vouloir annuler l'abonnement "${cancelSubConfirm?.name || ''}" ? Cette action est irreversible.`}
        confirmText="Annuler l'abonnement"
        cancelText="Retour"
        variant="danger"
        isLoading={isCancelingSub}
      />
    </DashboardLayout>
  )
}
