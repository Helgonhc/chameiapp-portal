export interface ServiceOrder {
  id: string
  title: string
  description: string
  status: 'aberto' | 'em_analise' | 'aprovado' | 'convertido' | 'rejeitado'
  priority: 'baixa' | 'media' | 'alta'
  created_at: string
  updated_at?: string
  photos?: string[] | null
  client_id: string
  opened_by_type: 'client' | 'technician' | 'admin'
  equipment_id?: string | null
  maintenance_type_id?: string | null
  technician_id?: string | null
  scheduled_at?: string | null
  completed_at?: string | null
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  responsible_name?: string
  client_logo_url?: string
  logo_url?: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: any
  is_read: boolean
  created_at: string
  read_at?: string
  order_id?: string
  quote_id?: string
  user_id: string
}

export interface Quote {
  id: string
  quote_number: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'converted'
  subtotal: number
  discount: number
  discount_type: 'fixed' | 'percentage'
  tax: number
  total: number
  valid_until: string
  notes?: string
  terms?: string
  created_at: string
  updated_at: string
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
  client_id: string
  created_by?: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  item_type: 'service' | 'material' | 'labor'
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
  sort_order: number
}
