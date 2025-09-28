import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Trophy,
  Users,
  Clock
} from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import clsx from 'clsx';

interface CalendarEvent {
  id: string;
  date: string;
  type: 'match' | 'training' | 'rest' | 'transfer';
  title: string;
  description?: string;
  opponent?: string;
  competition?: string;
  isHome?: boolean;
}

// Mock calendar events
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    date: '2024-08-12',
    type: 'match',
    title: 'vs Real IberiaX',
    opponent: 'Real IberiaX',
    competition: 'IberiaX Primera',
    isHome: true,
  },
  {
    id: '2',
    date: '2024-08-15',
    type: 'training',
    title: 'Treino de Finalização',
    description: 'Foco em precisão e força dos chutes',
  },
  {
    id: '3',
    date: '2024-08-19',
    type: 'match',
    title: 'vs AC ItalicaX',
    opponent: 'AC ItalicaX',
    competition: 'IberiaX Primera',
    isHome: false,
  },
  {
    id: '4',
    date: '2024-08-22',
    type: 'rest',
    title: 'Descanso',
    description: 'Dia de folga para os jogadores',
  },
];

export const Calendar: React.FC = () => {
  const { t } = useTranslation();
  const { currentGame, setCurrentScreen, advanceDate } = useGameStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const currentDate = currentGame?.currentDate || new Date();

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const handleAdvanceToDate = (targetDate: string) => {
    const target = new Date(targetDate);
    const current = new Date(currentDate);
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      advanceDate(diffDays);
    }
  };

  const getEventsForDate = (date: string) => {
    return mockEvents.filter(event => event.date === date);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'match':
        return <Play size={16} className="text-blue-400" />;
      case 'training':
        return <Users size={16} className="text-green-400" />;
      case 'rest':
        return <Clock size={16} className="text-gray-400" />;
      case 'transfer':
        return <Trophy size={16} className="text-yellow-400" />;
      default:
        return <CalendarIcon size={16} className="text-gray-400" />;
    }
  };

  const getEventBgColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'match':
        return 'bg-blue-600/20 border-blue-500';
      case 'training':
        return 'bg-green-600/20 border-green-500';
      case 'rest':
        return 'bg-gray-600/20 border-gray-500';
      case 'transfer':
        return 'bg-yellow-600/20 border-yellow-500';
      default:
        return 'bg-gray-600/20 border-gray-500';
    }
  };

  // Generate week view dates
  const getWeekDates = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarIcon size={24} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                {t('calendar.title')}
              </h1>
              <p className="text-sm text-gray-400">
                {formatDate(currentDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={clsx(
                  'px-3 py-1 rounded text-sm transition-colors',
                  viewMode === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={clsx(
                  'px-3 py-1 rounded text-sm transition-colors',
                  viewMode === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Mês
              </button>
            </div>

            {/* Navigation */}
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {viewMode === 'week' ? (
          /* Week View */
          <div className="grid grid-cols-7 gap-4 h-full">
            {getWeekDates().map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const events = getEventsForDate(dateStr);
              const isToday = dateStr === currentDate.toISOString().split('T')[0];
              
              return (
                <div key={index} className="flex flex-col">
                  {/* Day header */}
                  <div className={clsx(
                    'text-center p-3 rounded-lg mb-3',
                    isToday ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
                  )}>
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold">
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="flex-1 space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={clsx(
                          'p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity',
                          getEventBgColor(event.type)
                        )}
                        onClick={() => {
                          if (event.type === 'match') {
                            setCurrentScreen('match');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getEventIcon(event.type)}
                          <span className="text-sm font-medium text-white">
                            {event.title}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-gray-400">
                            {event.description}
                          </p>
                        )}
                        {event.competition && (
                          <p className="text-xs text-blue-400">
                            {event.competition}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Month View - Simplified */
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              
              <div className="space-y-3">
                {mockEvents.map((event) => (
                  <div
                    key={event.id}
                    className={clsx(
                      'p-4 rounded-lg border flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity',
                      getEventBgColor(event.type)
                    )}
                    onClick={() => {
                      if (event.type === 'match') {
                        setCurrentScreen('match');
                      }
                    }}
                  >
                    <div className="text-sm text-gray-400 min-w-[80px]">
                      {new Date(event.date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-sm text-gray-400">
                          {event.description}
                        </div>
                      )}
                      {event.competition && (
                        <div className="text-sm text-blue-400">
                          {event.competition}
                        </div>
                      )}
                    </div>
                    {event.type === 'match' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvanceToDate(event.date);
                          setCurrentScreen('match');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        Jogar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
