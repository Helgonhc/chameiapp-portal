'use client'

import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState } from 'react'

const locales = {
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  priority: string
  order_number: string
}

interface CalendarProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export default function Calendar({ events, onSelectEvent, onSelectSlot }: CalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  // Cores por status
  const getEventStyle = (event: CalendarEvent) => {
    const colors: { [key: string]: { bg: string; border: string; text: string } } = {
      pending: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
      scheduled: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
      in_progress: { bg: '#E9D5FF', border: '#A855F7', text: '#6B21A8' },
      completed: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
      cancelled: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
    }

    const color = colors[event.status] || colors.pending

    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        color: color.text,
        borderRadius: '4px',
        padding: '2px 5px',
        fontSize: '12px',
        fontWeight: '500',
      },
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 overflow-hidden">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
          min-height: 600px;
        }
        
        .rbc-header {
          padding: 12px 8px;
          font-weight: 700;
          font-size: 13px;
          color: #0f172a;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .rbc-today {
          background-color: #eff6ff !important;
        }
        
        .rbc-off-range-bg {
          background-color: #fafafa;
        }
        
        .rbc-event {
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        }
        
        .rbc-toolbar {
          padding: 0 0 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .rbc-toolbar button {
          padding: 10px 20px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .rbc-toolbar button:hover {
          background: #f8fafc;
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59,130,246,0.2);
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 4px 6px rgba(59,130,246,0.3);
        }
        
        .rbc-toolbar-label {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        
        .rbc-month-view {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }
        
        .rbc-day-bg {
          border-left: 1px solid #f1f5f9;
          transition: background 0.2s;
        }
        
        .rbc-day-bg:hover {
          background: #fafafa;
        }
        
        .rbc-month-row {
          border-top: 1px solid #f1f5f9;
        }
        
        .rbc-date-cell {
          padding: 8px;
          text-align: right;
        }
        
        .rbc-date-cell > a {
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .rbc-date-cell > a:hover {
          background: #f1f5f9;
          color: #3b82f6;
        }
        
        .rbc-now > a {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white !important;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(59,130,246,0.3);
        }
        
        .rbc-off-range .rbc-date-cell > a {
          color: #cbd5e1;
        }
        
        .rbc-show-more {
          background: #f1f5f9;
          color: #3b82f6;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          margin: 2px;
        }
        
        .rbc-show-more:hover {
          background: #3b82f6;
          color: white;
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
