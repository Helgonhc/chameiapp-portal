'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, DollarSign, User, Tag } from 'lucide-react'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  type: 'orders' | 'tickets' | 'quotes'
}

export interface SearchFilters {
  searchTerm: string
  status?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
  minValue?: number
  maxValue?: number
  technician?: string
}

export default function AdvancedSearch({ onSearch, onClear, type }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
    minValue: undefined,
    maxValue: undefined,
    technician: '',
  })

  const statusOptions = {
    orders: [
      { value: '', label: 'Todos os Status' },
      { value: 'pending', label: 'Pendente' },
      { value: 'scheduled', label: 'Agendada' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'paused', label: 'Pausada' },
      { value: 'completed', label: 'Concluída' },
      { value: 'cancelled', label: 'Cancelada' },
    ],
    tickets: [
      { value: '', label: 'Todos os Status' },
      { value: 'aberto', label: 'Aberto' },
      { value: 'em_analise', label: 'Em Análise' },
      { value: 'aprovado', label: 'Aprovado' },
      { value: 'rejeitado', label: 'Rejeitado' },
      { value: 'convertido', label: 'Convertido' },
    ],
    quotes: [
      { value: '', label: 'Todos os Status' },
      { value: 'pending', label: 'Aguardando' },
      { value: 'approved', label: 'Aprovado' },
      { value: 'rejected', label: 'Rejeitado' },
      { value: 'expired', label: 'Expirado' },
      { value: 'converted', label: 'Convertido' },
    ],
  }

  const priorityOptions = [
    { value: '', label: 'Todas as Prioridades' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
  ]

  function handleSearch() {
    onSearch(filters)
    setIsOpen(false)
  }

  function handleClear() {
    const clearedFilters: SearchFilters = {
      searchTerm: '',
      status: '',
      priority: '',
      dateFrom: '',
      dateTo: '',
      minValue: undefined,
      maxValue: undefined,
      technician: '',
    }
    setFilters(clearedFilters)
    onClear()
    setIsOpen(false)
  }

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.status ||
    filters.priority ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minValue ||
    filters.maxValue ||
    filters.technician

  return (
    <div className="relative">
      {/* Search Bar */}
      <div className="flex gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por título, número..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all flex items-center gap-2 ${
            hasActiveFilters
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-red-100 text-red-600 rounded-lg sm:rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                Filtros Avançados
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions[type].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority (for tickets and orders) */}
              {(type === 'tickets' || type === 'orders') && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    Prioridade
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Value Range (for orders and quotes) */}
              {(type === 'orders' || type === 'quotes') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Valor Mínimo
                    </label>
                    <input
                      type="number"
                      value={filters.minValue || ''}
                      onChange={(e) => setFilters({ ...filters, minValue: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="R$ 0,00"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Valor Máximo
                    </label>
                    <input
                      type="number"
                      value={filters.maxValue || ''}
                      onChange={(e) => setFilters({ ...filters, maxValue: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="R$ 9999,99"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Technician (for orders) */}
              {type === 'orders' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Técnico
                  </label>
                  <input
                    type="text"
                    value={filters.technician}
                    onChange={(e) => setFilters({ ...filters, technician: e.target.value })}
                    placeholder="Nome do técnico..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Limpar Filtros
              </button>
              <button
                onClick={handleSearch}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                Aplicar Filtros
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
