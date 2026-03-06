'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, MediaItem } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  FileText,
  Printer,
  QrCode,
  Save,
  Eye,
  Loader2,
  Hash,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
  Check,
  Receipt,
  X,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MediaSelectorModal } from '@/components/shared/MediaSelectorModal'
import { TemplatePreviewModal } from '@/components/shared/TemplatePreviewModal'
import { cn } from '@/lib/utils'

interface ReceiptTemplate {
  id: string
  name: string
  description: string | null
  type: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
  isSystem: boolean
  isDefault: boolean
  previewImage: string | null
}

interface ReceiptSettingsData {
  id: string
  ticketTemplateId: string | null
  invoiceSimpleTemplateId: string | null
  invoiceFullTemplateId: string | null
  logo: string | null
  thankYouMessage: string | null
  footerText: string | null
  showQrCode: boolean
  qrCodeType: string
  qrCodeCustomUrl: string | null
  autoPrintOnOrder: boolean
  autoEmailOnOrder: boolean
  defaultReceiptType: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
  receiptPrefix: string
  nextSequenceNumber: number
}

interface ReceiptSettingsProps {
  receiptSettings: ReceiptSettingsData | null
  receiptTemplates: ReceiptTemplate[]
  restaurantId: string
  onUpdate: () => void
  primaryColor?: string
}

const typeLabels: Record<string, string> = {
  TICKET: 'Ticket de caisse',
  INVOICE_SIMPLE: 'Facture simplifiée',
  INVOICE_FULL: 'Facture complète',
}

export function ReceiptSettings({ 
  receiptSettings, 
  receiptTemplates = [], 
  restaurantId, 
  onUpdate, 
  primaryColor = '#10b981' 
}: ReceiptSettingsProps) {
  const [formData, setFormData] = useState({
    ticketTemplateId: receiptSettings?.ticketTemplateId || '',
    invoiceSimpleTemplateId: receiptSettings?.invoiceSimpleTemplateId || '',
    invoiceFullTemplateId: receiptSettings?.invoiceFullTemplateId || '',
    logo: receiptSettings?.logo || '',
    thankYouMessage: receiptSettings?.thankYouMessage || 'Merci de votre visite !',
    footerText: receiptSettings?.footerText || '',
    showQrCode: receiptSettings?.showQrCode ?? true,
    qrCodeType: receiptSettings?.qrCodeType || 'receipt',
    qrCodeCustomUrl: receiptSettings?.qrCodeCustomUrl || '',
    autoPrintOnOrder: receiptSettings?.autoPrintOnOrder ?? false,
    autoEmailOnOrder: receiptSettings?.autoEmailOnOrder ?? false,
    defaultReceiptType: receiptSettings?.defaultReceiptType || 'TICKET',
    receiptPrefix: receiptSettings?.receiptPrefix || 'TK',
  })

  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<ReceiptTemplate | null>(null)

  // Filtrer les templates par type
  const ticketTemplates = receiptTemplates.filter(t => t.type === 'TICKET')
  const invoiceSimpleTemplates = receiptTemplates.filter(t => t.type === 'INVOICE_SIMPLE')
  const invoiceFullTemplates = receiptTemplates.filter(t => t.type === 'INVOICE_FULL')

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.receipts.updateSettings({
        ...data,
        ticketTemplateId: data.ticketTemplateId || undefined,
        invoiceSimpleTemplateId: data.invoiceSimpleTemplateId || undefined,
        invoiceFullTemplateId: data.invoiceFullTemplateId || undefined,
        logo: data.logo || undefined,
        footerText: data.footerText || undefined,
        qrCodeCustomUrl: data.qrCodeCustomUrl || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Paramètres des reçus mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const isLoading = updateMutation.isPending

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const selected = Array.isArray(media) ? media[0] : media
    if (selected) {
      setFormData({ ...formData, logo: selected.url })
    }
    setIsMediaSelectorOpen(false)
  }

  // Composant pour afficher une carte de template avec miniature réelle
  const TemplateCard = ({ 
    template, 
    isSelected, 
    onSelect,
    onPreview,
  }: { 
    template: ReceiptTemplate
    isSelected: boolean
    onSelect: () => void
    onPreview: () => void
  }) => {
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(true)

    useEffect(() => {
      let mounted = true
      setIsLoadingPreview(true)
      api.restaurant.receipts.getTemplatePreviewHtml(template.id)
        .then((html) => {
          if (mounted) {
            setPreviewHtml(html)
            setIsLoadingPreview(false)
          }
        })
        .catch(() => {
          if (mounted) setIsLoadingPreview(false)
        })
      return () => { mounted = false }
    }, [template.id])

    // Adapter les dimensions selon le type de template
    const isInvoice = template.type === 'INVOICE_SIMPLE' || template.type === 'INVOICE_FULL'

    return (
      <div
        className={cn(
          "relative border-2 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md",
          isSelected ? "border-current" : "border-gray-200 hover:border-gray-300"
        )}
        style={isSelected ? { borderColor: primaryColor } : undefined}
        onClick={onSelect}
      >
        {/* Preview miniature réelle */}
        <div className={cn(
          "bg-white rounded-lg mb-3 overflow-hidden relative border border-gray-100",
          isInvoice ? "aspect-[210/297]" : "aspect-[3/4]"
        )}>
          {isLoadingPreview ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : previewHtml ? (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="border-0 pointer-events-none w-full h-full"
                style={isInvoice ? {
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  width: '200%',
                  height: '200%',
                } : {
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  width: '200%',
                  height: '200%',
                }}
                title={template.name}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Receipt size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <p className="font-medium text-sm text-gray-900 truncate">{template.name}</p>
          {template.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
          )}
          <div className="flex items-center gap-2">
            {template.isSystem && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                Système
              </span>
            )}
            {template.isDefault && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Par défaut
              </span>
            )}
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div 
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Check size={14} />
          </div>
        )}

        {/* Preview button */}
        <button
          type="button"
          className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-lg flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
        >
          <Eye size={14} />
        </button>
      </div>
    )
  }

  // Section de sélection de template par type
  const TemplateSection = ({
    title,
    type,
    templates,
    selectedId,
    onSelect,
  }: {
    title: string
    type: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
    templates: ReceiptTemplate[]
    selectedId: string
    onSelect: (id: string) => void
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      {templates.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
          Aucun template disponible
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onSelect={() => onSelect(template.id)}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      )}
    </div>
  )

  // Style pour les inputs avec focus coloré
  const inputFocusStyle = { '--tw-ring-color': primaryColor } as React.CSSProperties

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Paramètres des reçus</h3>
        <p className="text-sm text-gray-500">Configurez vos tickets et factures</p>
      </div>

      {/* Templates */}
      <div className="space-y-6">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <FileText size={16} style={{ color: primaryColor }} />
          Templates de documents
        </h4>
        
        <TemplateSection
          title="Ticket de caisse"
          type="TICKET"
          templates={ticketTemplates}
          selectedId={formData.ticketTemplateId}
          onSelect={(id) => setFormData({ ...formData, ticketTemplateId: id })}
        />

        <TemplateSection
          title="Facture simplifiée"
          type="INVOICE_SIMPLE"
          templates={invoiceSimpleTemplates}
          selectedId={formData.invoiceSimpleTemplateId}
          onSelect={(id) => setFormData({ ...formData, invoiceSimpleTemplateId: id })}
        />

        <TemplateSection
          title="Facture complète"
          type="INVOICE_FULL"
          templates={invoiceFullTemplates}
          selectedId={formData.invoiceFullTemplateId}
          onSelect={(id) => setFormData({ ...formData, invoiceFullTemplateId: id })}
        />
      </div>

      {/* Numérotation */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Hash size={16} style={{ color: primaryColor }} />
          Numérotation
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiptPrefix">Préfixe des reçus</Label>
            <Input
              id="receiptPrefix"
              value={formData.receiptPrefix}
              onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value.toUpperCase() })}
              placeholder="TK"
              maxLength={5}
              className="h-11 rounded-xl focus:ring-2"
              style={inputFocusStyle}
            />
            <p className="text-xs text-gray-500">
              Exemple : {formData.receiptPrefix || 'TK'}-20260207-0001
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultReceiptType">Type de document par défaut</Label>
            <Select
              value={formData.defaultReceiptType}
              onValueChange={(value: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL') => 
                setFormData({ ...formData, defaultReceiptType: value })
              }
            >
              <SelectTrigger 
                className="h-11 rounded-xl focus:ring-2"
                style={inputFocusStyle}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="TICKET">Ticket de caisse</SelectItem>
                <SelectItem value="INVOICE_SIMPLE">Facture simplifiée</SelectItem>
                <SelectItem value="INVOICE_FULL">Facture complète</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Personnalisation */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <MessageSquare size={16} style={{ color: primaryColor }} />
          Personnalisation
        </h4>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thankYouMessage">Message de remerciement</Label>
            <Input
              id="thankYouMessage"
              value={formData.thankYouMessage}
              onChange={(e) => setFormData({ ...formData, thankYouMessage: e.target.value })}
              placeholder="Merci de votre visite !"
              maxLength={100}
              className="h-11 rounded-xl focus:ring-2"
              style={inputFocusStyle}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerText">Texte de pied de page</Label>
            <Textarea
              id="footerText"
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              placeholder="Informations légales, mentions..."
              rows={2}
              maxLength={200}
              className="rounded-xl focus:ring-2"
              style={inputFocusStyle}
            />
          </div>

          {/* Logo avec MediaSelector */}
          <div className="space-y-2">
            <Label>Logo personnalisé</Label>
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <div className="relative">
                  <img 
                    src={formData.logo} 
                    alt="Logo" 
                    className="w-20 h-20 object-contain rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => setIsMediaSelectorOpen(true)}
                >
                  <ImageIcon size={24} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => setIsMediaSelectorOpen(true)}
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center transition-colors"
                >
                  <ImageIcon size={16} className="mr-2" />
                  {formData.logo ? 'Changer le logo' : 'Sélectionner un logo'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour utiliser le logo du restaurant
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <QrCode size={16} style={{ color: primaryColor }} />
          QR Code
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Afficher le QR Code</p>
              <p className="text-sm text-gray-500">Ajoute un QR code sur les reçus</p>
            </div>
            <Switch
              checked={formData.showQrCode}
              onCheckedChange={(checked) => setFormData({ ...formData, showQrCode: checked })}
              style={{ 
                '--switch-checked-bg': primaryColor,
              } as React.CSSProperties}
              className="data-[state=checked]:bg-[var(--switch-checked-bg)]"
            />
          </div>

          {formData.showQrCode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="qrCodeType">Contenu du QR Code</Label>
                <Select
                  value={formData.qrCodeType}
                  onValueChange={(value) => setFormData({ ...formData, qrCodeType: value })}
                >
                  <SelectTrigger 
                    className="h-11 rounded-xl focus:ring-2"
                    style={inputFocusStyle}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="receipt">Lien vers le reçu en ligne</SelectItem>
                    <SelectItem value="restaurant">Site du restaurant</SelectItem>
                    <SelectItem value="review">Laisser un avis</SelectItem>
                    <SelectItem value="custom">URL personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.qrCodeType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="qrCodeCustomUrl">URL personnalisée</Label>
                  <Input
                    id="qrCodeCustomUrl"
                    value={formData.qrCodeCustomUrl}
                    onChange={(e) => setFormData({ ...formData, qrCodeCustomUrl: e.target.value })}
                    placeholder="https://..."
                    className="h-11 rounded-xl focus:ring-2"
                    style={inputFocusStyle}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Automatisation */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Printer size={16} style={{ color: primaryColor }} />
          Automatisation
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Impression automatique</p>
              <p className="text-sm text-gray-500">Imprime automatiquement à chaque commande</p>
            </div>
            <Switch
              checked={formData.autoPrintOnOrder}
              onCheckedChange={(checked) => setFormData({ ...formData, autoPrintOnOrder: checked })}
              style={{ 
                '--switch-checked-bg': primaryColor,
              } as React.CSSProperties}
              className="data-[state=checked]:bg-[var(--switch-checked-bg)]"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Envoi par email automatique</p>
              <p className="text-sm text-gray-500">Envoie le reçu par email au client</p>
            </div>
            <Switch
              checked={formData.autoEmailOnOrder}
              onCheckedChange={(checked) => setFormData({ ...formData, autoEmailOnOrder: checked })}
              style={{ 
                '--switch-checked-bg': primaryColor,
              } as React.CSSProperties}
              className="data-[state=checked]:bg-[var(--switch-checked-bg)]"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: primaryColor }}
          className="h-11 px-6 rounded-xl text-white hover:opacity-90"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={handleMediaSelect}
        primaryColor={primaryColor}
        title="Sélectionner un logo"
        restaurantId={restaurantId}
        folder="logos"
      />

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          fetchHtml={() => api.restaurant.receipts.getTemplatePreviewHtml(previewTemplate.id)}
          title={`Aperçu : ${previewTemplate.name}`}
          primaryColor={primaryColor}
        />
      )}
    </form>
  )
}
