'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Plus, Download, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/shared/dashboard'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import {
  CustomerStats,
  CustomerList,
  CustomerFormModal,
  CustomerDetailPanel,
  CustomerFilters,
  ExportCustomersModal,
} from '@/components/restaurant/customers'
import type { CustomerListItem, CustomerFilters as CustomerFiltersType, Customer } from '@/types/customer'

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { canViewCustomers, canExportData, isOwner, isOwnerOrManager } = useRestaurantPermissions()
  const { format: formatCurrency } = useRestaurantCurrency()

  const primaryColor = organization?.primaryColor || '#10b981'

  const handleSwitchRestaurant = (restaurantId: string) => {
    if (accessToken) {
      switchRestaurant(accessToken, restaurantId)
    }
  }

  const [filters, setFilters] = useState<CustomerFiltersType>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [deleteCustomer, setDeleteCustomer] = useState<CustomerListItem | null>(null)

  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }))
  }, [currentRestaurantId])

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['restaurant-customers-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.customers.getStats(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: customersResponse, isLoading: customersLoading } = useQuery({
    queryKey: ['restaurant-customers', currentRestaurantId, filters],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.customers.list({
        ...filters,
        restaurantId: currentRestaurantId || undefined,
      })
      return res
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 30 * 1000,
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.toggle(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
      toast.success('Statut modifié')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers-stats'] })
      toast.success('Client supprimé')
      setDeleteCustomer(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const handleView = (customer: CustomerListItem) => {
    setSelectedCustomerId(customer.id)
    setIsPanelOpen(true)
  }

  const handleEdit = (customer: CustomerListItem | Customer) => {
    setEditingCustomer(customer as Customer)
    setIsFormModalOpen(true)
    setIsPanelOpen(false)
  }

  const handleDelete = (customer: CustomerListItem) => {
    setDeleteCustomer(customer)
  }

  const handleToggle = (customer: CustomerListItem) => {
    toggleMutation.mutate(customer.id)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setEditingCustomer(null)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedCustomerId(null)
  }

  const customers = (customersResponse?.data || []) as CustomerListItem[]
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 20,
    total: (customersResponse as any)?.pagination?.total || 0,
    totalPages: (customersResponse as any)?.pagination?.totalPages || 1,
  }

  const availableTags = statsData?.uniqueTags || []

  if (!canViewCustomers) {
    return (
      <DashboardLayout
        navigation={navigation}
        basePath="/restaurant"
        logoText={organization?.name}
        primaryColor={primaryColor}
        restaurants={restaurants}
        currentRestaurantId={currentRestaurantId}
        onSwitchRestaurant={handleSwitchRestaurant}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-sm text-gray-500">Vous n'avez pas la permission de voir cette page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={handleSwitchRestaurant}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Users size={24} style={{ color: primaryColor }} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Clients</h1>
                {statsData && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {statsData.total} clients
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Gérez vos clients et leurs informations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canExportData && (
              <Button
                variant="outline"
                onClick={() => setIsExportModalOpen(true)}
                className="h-11 rounded-xl transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.color = primaryColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                <Download size={16} className="mr-2" />
                Exporter
              </Button>
            )}
            {isOwnerOrManager && (
              <Button
                onClick={() => {
                  setEditingCustomer(null)
                  setIsFormModalOpen(true)
                }}
                style={{ backgroundColor: primaryColor }}
                className="text-white h-11 rounded-xl"
              >
                <Plus size={16} className="mr-2" />
                <span className="hidden sm:inline">Ajouter un client</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <CustomerStats
          stats={statsData}
          isLoading={statsLoading}
          formatCurrency={formatCurrency}
          primaryColor={primaryColor}
        />

        {/* Filters */}
        <CustomerFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
          primaryColor={primaryColor}
        />

        {/* List */}
        <CustomerList
          customers={customers}
          isLoading={customersLoading}
          pagination={pagination}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          onLimitChange={(limit) => setFilters(prev => ({ ...prev, limit, page: 1 }))}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          formatCurrency={formatCurrency}
          primaryColor={primaryColor}
          canEdit={isOwnerOrManager}
          canDelete={isOwner}
        />

      {/* Panel détails */}
      <CustomerDetailPanel
        customerId={selectedCustomerId}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onEdit={handleEdit}
        primaryColor={primaryColor}
        formatCurrency={formatCurrency}
      />

      {/* Modal création/édition */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        customer={editingCustomer}
        primaryColor={primaryColor}
      />

      {/* Modal export */}
      <ExportCustomersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        primaryColor={primaryColor}
      />

      {/* Modal suppression */}
      <ConfirmModal
        isOpen={!!deleteCustomer}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={() => deleteCustomer && deleteMutation.mutate(deleteCustomer.id)}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteCustomer?.firstName} ${deleteCustomer?.lastName} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
