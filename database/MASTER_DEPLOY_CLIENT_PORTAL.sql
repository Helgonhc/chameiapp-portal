-- ==============================================================================
-- SCRIPT MESTRE DE IMPLANTAÇÃO - PORTAL DO CLIENTE 2.0 (CORRIGIDO)
-- ==============================================================================
-- Este script aplica TODAS as alterações de banco de dados necessárias.
-- Execute este script COMPLETO no Editor SQL do Supabase.
-- ==============================================================================

-- Garantir extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SISTEMA DE CHAT PARA TICKETS
-- ==============================================================================

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

-- Adicionar coluna last_message_at em tickets de forma segura
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='last_message_at') THEN
        ALTER TABLE tickets ADD COLUMN last_message_at TIMESTAMPTZ;
    END IF;
END $$;

-- Função auxiliar para atualizar timestamp do ticket
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_ticket_last_message ON ticket_messages;
CREATE TRIGGER trigger_update_ticket_last_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();

-- Habilitar RLS
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Recriando para garantir)
DROP POLICY IF EXISTS "Clients can view own ticket messages" ON ticket_messages;
CREATE POLICY "Clients can view own ticket messages" ON ticket_messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM tickets 
        JOIN profiles ON profiles.client_id = tickets.client_id 
        WHERE tickets.id = ticket_messages.ticket_id 
        AND profiles.id = auth.uid() 
        AND profiles.role = 'client'
    )
    AND is_internal = false
);

DROP POLICY IF EXISTS "Clients can insert own ticket messages" ON ticket_messages;
CREATE POLICY "Clients can insert own ticket messages" ON ticket_messages FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM tickets 
        JOIN profiles ON profiles.client_id = tickets.client_id 
        WHERE tickets.id = ticket_messages.ticket_id 
        AND profiles.id = auth.uid() 
        AND profiles.role = 'client'
    )
    AND is_internal = false AND sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Staff can view all ticket messages" ON ticket_messages;
CREATE POLICY "Staff can view all ticket messages" ON ticket_messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'technician'))
);

DROP POLICY IF EXISTS "Staff can insert ticket messages" ON ticket_messages;
CREATE POLICY "Staff can insert ticket messages" ON ticket_messages FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'technician'))
);

-- Função de Notificação
CREATE OR REPLACE FUNCTION notify_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket_owner_id UUID;
  v_sender_role TEXT;
  v_ticket_number TEXT;
BEGIN
  SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.sender_id;
  SELECT client_id, ticket_number INTO v_ticket_owner_id, v_ticket_number FROM tickets WHERE id = NEW.ticket_id;

  -- Se for mensagem interna, sai
  IF NEW.is_internal THEN RETURN NEW; END IF;

  -- Se Admin/Tecnico -> Notifica Cliente
  IF v_sender_role IN ('admin', 'technician') THEN
    INSERT INTO notifications (user_id, title, body, type, data, created_at)
    SELECT p.id, 'Nova mensagem no chamado ' || v_ticket_number, 'Técnico respondeu: ' || left(NEW.message, 50) || '...', 'ticket_message', jsonb_build_object('ticket_id', NEW.ticket_id), NOW()
    FROM profiles p WHERE p.client_id = v_ticket_owner_id AND p.role = 'client';
  
  -- Se Cliente -> Notifica Admin
  ELSIF v_sender_role = 'client' THEN
    INSERT INTO notifications (user_id, title, body, type, data, created_at)
    SELECT p.id, 'Nova resposta no chamado ' || v_ticket_number, 'Cliente respondeu: ' || left(NEW.message, 50) || '...', 'ticket_message', jsonb_build_object('ticket_id', NEW.ticket_id), NOW()
    FROM profiles p WHERE p.role = 'admin' AND p.is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de notificação
DROP TRIGGER IF EXISTS trigger_notify_ticket_message ON ticket_messages;
CREATE TRIGGER trigger_notify_ticket_message AFTER INSERT ON ticket_messages FOR EACH ROW EXECUTE FUNCTION notify_ticket_message();


-- ==============================================================================
-- 2. ORÇAMENTOS: STATUS DE REVISÃO
-- ==============================================================================

-- Atualizar constraints de status de forma segura com DO block
DO $$
BEGIN
    ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
    ALTER TABLE quotes ADD CONSTRAINT quotes_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'converted', 'review_requested'));
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignora erro se já existir algo conflitante
END $$;

-- Adicionar coluna revision_notes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='revision_notes') THEN
        ALTER TABLE quotes ADD COLUMN revision_notes TEXT;
    END IF;
END $$;


-- ==============================================================================
-- 3. EQUIPAMENTOS (GÊMEO DIGITAL)
-- ==============================================================================

-- Adicionar colunas na tabela equipments
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipments' AND column_name = 'qr_code') THEN 
      ALTER TABLE public.equipments ADD COLUMN qr_code TEXT UNIQUE; 
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipments' AND column_name = 'gps_latitude') THEN 
      ALTER TABLE public.equipments ADD COLUMN gps_latitude DECIMAL(10, 8);
      ALTER TABLE public.equipments ADD COLUMN gps_longitude DECIMAL(11, 8);
      ALTER TABLE public.equipments ADD COLUMN gps_address TEXT; 
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipments' AND column_name = 'next_maintenance_date') THEN 
      ALTER TABLE public.equipments ADD COLUMN next_maintenance_date DATE;
      ALTER TABLE public.equipments ADD COLUMN maintenance_frequency_months INTEGER DEFAULT 12;
      ALTER TABLE public.equipments ADD COLUMN last_maintenance_date DATE; 
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipments' AND column_name = 'warranty_expiry_date') THEN 
      ALTER TABLE public.equipments ADD COLUMN warranty_expiry_date DATE;
      ALTER TABLE public.equipments ADD COLUMN purchase_date DATE;
      ALTER TABLE public.equipments ADD COLUMN purchase_value DECIMAL(10,2);
      ALTER TABLE public.equipments ADD COLUMN supplier TEXT; 
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipments' AND column_name = 'alert_status') THEN 
      ALTER TABLE public.equipments ADD COLUMN alert_status TEXT DEFAULT 'ok'; 
  END IF;
END $$;

-- Tabelas Auxiliares de Equipamentos
CREATE TABLE IF NOT EXISTS public.equipment_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.equipment_maintenance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
  maintenance_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed_date DATE,
  technician_id UUID REFERENCES public.profiles(id),
  labor_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  status TEXT DEFAULT 'concluido',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.equipment_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em tabelas novas
ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas simples
DROP POLICY IF EXISTS "Permitir leitura geral equipamentos" ON public.equipment_documents;
CREATE POLICY "Permitir leitura geral equipamentos" ON public.equipment_documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir leitura geral historico" ON public.equipment_maintenance_history;
CREATE POLICY "Permitir leitura geral historico" ON public.equipment_maintenance_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir leitura geral alertas" ON public.equipment_alerts;
CREATE POLICY "Permitir leitura geral alertas" ON public.equipment_alerts FOR SELECT TO authenticated USING (true);

-- Atualizar QR Codes existentes
UPDATE public.equipments SET qr_code = 'EQ-' || UPPER(SUBSTRING(id::TEXT, 1, 8)) WHERE qr_code IS NULL;


-- ==============================================================================
-- 4. PERMISSÕES DE USUÁRIOS
-- ==============================================================================

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'permissions') THEN
        ALTER TABLE profiles ADD COLUMN permissions JSONB DEFAULT '{"can_view_financial": true, "can_open_tickets": true, "can_approve_maintenance": true}';
    END IF;
END $$;

-- Atualizar perfis existentes
UPDATE profiles SET permissions = '{"can_view_financial": true, "can_open_tickets": true, "can_approve_maintenance": true}' WHERE permissions IS NULL;
