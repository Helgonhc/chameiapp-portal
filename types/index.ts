// =====================================================
// TIPOS DO PORTAL DO CLIENTE
// =====================================================

export interface ServiceOrder {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client_id: string
  technician_id?: string
  equipment_id?: string
  scheduled_date?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  
  // Relacionamentos
  client?: Client
  technician?: Profile
  equipment?: Equipment
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  cnpj_cpf?: string
  ie_rg?: string
  responsible_name?: string
  type?: 'PF' | 'PJ'
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'technician' | 'client'
  client_id?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  client_id: string
  name: string
  brand?: string
  model?: string
  serial_number?: string
  description?: string
  location?: string
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  client_id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  created_at: string
  updated_at: string
  
  // Relacionamentos
  client?: Client
}

export interface Quote {
  id: string
  client_id: string
  title: string
  description?: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  total_amount: number
  valid_until?: string
  created_at: string
  updated_at: string
  
  // Relacionamentos
  client?: Client
  quote_items?: QuoteItem[]
}

export interface QuoteItem {
  id: string
  quote_id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export interface Appointment {
  id: string
  client_id: string
  technician_id?: string
  title: string
  description?: string
  scheduled_date: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
  
  // Relacionamentos
  client?: Client
  technician?: Profile
}
