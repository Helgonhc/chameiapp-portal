'use client'

import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState } from 'react'

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  priority: string
  order_number: string
  type?: 'order' | 'maintenance'
}

interface CalendarProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export default function Calendar({ events, onSelectEvent, onSelectSlot }: CalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  const getEventStyle = (event: CalendarEvent) => {
    const colors: { [key: string]: { bg: string; border: string; text: string } } = {
      // Ordens de Serviço
      pending: { bg: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b', text: '#fcd34d' },
      scheduled: { bg: 'rgba(99, 102, 241, 0.3)', border: '#6366f1', text: '#a5b4fc' },
      in_progress: { bg: 'rgba(168, 85, 247, 0.3)', border: '#a855f7', text: '#d8b4fe' },
      completed: { bg: 'rgba(16, 185, 129, 0.3)', border: '#10b981', text: '#6ee7b7' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.3)', border: '#ef4444', text: '#fca5a5' },
      // Manutenções Periódicas
      vencido: { bg: 'rgba(239, 68, 68, 0.3)', border: '#ef4444', text: '#fca5a5' },
      urgente: { bg: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b', text: '#fcd34d' },
      proximo: { bg: 'rgba(59, 130, 246, 0.3)', border: '#3b82f6', text: '#93c5fd' },
      futuro: { bg: 'rgba(16, 185, 129, 0.3)', border: '#10b981', text: '#6ee7b7' },
    }
    const color = colors[event.status] || colors.pending
    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        color: color.text,
        borderRadius: '6px',
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: '600',
      },
    }
  }

  return (
    <div className="overflow-hidden">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
          min-height: 600px;
          background: transparent;
        }
        
        .rbc-header {
          padding: 12px 8px;
          font-weight: 700;
          font-size: 13px;
          color: #e4e4e7 !important;
          background: rgba(99, 102, 241, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .rbc-today {
          background-color: rgba(99, 102, 241, 0.15) !important;
        }
        
        .rbc-off-range-bg {
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        .rbc-event {
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }
        
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        
        .rbc-toolbar {
          padding: 0 0 16px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .rbc-toolbar button {
          padding: 10px 20px;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: #252542 !important;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #d4d4d8 !important;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background: #1a1a2e !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          color: #818cf8 !important;
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
          color: white !important;
          border-color: #6366f1 !important;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        
        .rbc-toolbar-label {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff !important;
        }
        
        .rbc-month-view {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px;
          overflow: hidden;
          background: #1a1a2e;
        }
        
        .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
          transition: background 0.2s;
        }
        
        .rbc-day-bg:hover {
          background: rgba(99, 102, 241, 0.05);
        }
        
        .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        
        .rbc-date-cell {
          padding: 8px;
          text-align: right;
        }
        
        .rbc-date-cell > a,
        .rbc-date-cell > button {
          color: #d4d4d8 !important;
          font-weight: 600;
          font-size: 14px;
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
          text-decoration: none;
        }
        
        .rbc-date-cell > a:hover,
        .rbc-date-cell > button:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8 !important;
        }
        
        .rbc-now > a,
        .rbc-now > button {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
          color: white !important;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }
        
        .rbc-off-range .rbc-date-cell > a,
        .rbc-off-range .rbc-date-cell > button {
          color: #52525b !important;
        }
        
        .rbc-show-more {
          background: rgba(99, 102, 241, 0.3) !important;
          color: #a5b4fc !important;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          margin: 2px;
        }
        
        .rbc-show-more:hover {
          background: #6366f1 !important;
          color: white !important;
        }

        .rbc-time-view, .rbc-agenda-view {
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px;
        }

        .rbc-time-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .rbc-time-header-content {
          border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .rbc-time-content {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .rbc-time-content > * + * > * {
          border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .rbc-timeslot-group {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .rbc-time-slot {
          border-top: 1px solid rgba(255, 255, 255, 0.03) !important;
        }

        .rbc-label {
          color: #a1a1aa !important;
        }
        
        .rbc-time-gutter {
          color: #a1a1aa !important;
        }

        .rbc-agenda-table {
          border: none !important;
        }
        
        .rbc-agenda-table thead > tr > th {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #e4e4e7 !important;
          background: rgba(99, 102, 241, 0.1);
          padding: 12px 8px;
        }
        
        .rbc-agenda-table tbody > tr > td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 12px 8px;
        }

        .rbc-agenda-date-cell, 
        .rbc-agenda-time-cell {
          color: #d4d4d8 !important;
        }

        .rbc-agenda-event-cell {
          color: #ffffff !important;
        }
        
        .rbc-agenda-empty {
          color: #71717a !important;
        }
        
        /* Row backgrounds */
        .rbc-row-bg {
          background: transparent;
        }
        
        .rbc-row-content {
          z-index: 1;
        }
        
        /* Current time indicator */
        .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }
        
        .rbc-current-time-indicator::before {
          background-color: #ef4444;
        }
      `}</style>

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={getEventStyle}
        messages={{
          next: 'Próximo',
          previous: 'Anterior',
          today: 'Hoje',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
          agenda: 'Agenda',
          date: 'Data',
          time: 'Hora',
          event: 'Evento',
          noEventsInRange: 'Não há ordens neste período',
          showMore: (total) => `+ ${total} mais`,
        }}
        culture="pt-BR"
      />
    </div>
  )
}
