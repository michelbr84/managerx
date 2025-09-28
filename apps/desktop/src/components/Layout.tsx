import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { Tooltip } from 'react-tooltip';
import { 
  Menu,
  Calendar,
  Users,
  Target,
  Play,
  Mail,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { ClubAssistant } from './ClubAssistant';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { currentScreen, setCurrentScreen } = useGameStore();
  const { 
    sidebarCollapsed, 
    isAssistantOpen, 
    toggleSidebar, 
    toggleAssistant,
    shortcutsEnabled 
  } = useUIStore();

  // Keyboard shortcuts
  useHotkeys('esc', () => setCurrentScreen('menu'), { enabled: shortcutsEnabled });
  useHotkeys('c', () => setCurrentScreen('calendar'), { enabled: shortcutsEnabled });
  useHotkeys('e', () => setCurrentScreen('squad'), { enabled: shortcutsEnabled });
  useHotkeys('t', () => setCurrentScreen('tactics'), { enabled: shortcutsEnabled });
  useHotkeys('i', () => setCurrentScreen('inbox'), { enabled: shortcutsEnabled });
  useHotkeys('s', () => setCurrentScreen('scouting'), { enabled: shortcutsEnabled });
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    useGameStore.getState().saveGame();
  }, { enabled: shortcutsEnabled });

  const navigationItems = [
    { key: 'menu', icon: Menu, label: t('navigation.menu'), shortcut: 'Esc' },
    { key: 'calendar', icon: Calendar, label: t('navigation.calendar'), shortcut: 'C' },
    { key: 'squad', icon: Users, label: t('navigation.squad'), shortcut: 'E' },
    { key: 'tactics', icon: Target, label: t('navigation.tactics'), shortcut: 'T' },
    { key: 'match', icon: Play, label: t('navigation.match') },
    { key: 'inbox', icon: Mail, label: t('navigation.inbox'), shortcut: 'I' },
    { key: 'scouting', icon: Search, label: t('navigation.scouting'), shortcut: 'S' },
    { key: 'settings', icon: Settings, label: t('navigation.settings') },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={clsx(
        'bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-blue-400">{t('app.title')}</h1>
                <p className="text-sm text-gray-400">{t('app.subtitle')}</p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              data-tooltip-id="sidebar-toggle"
              data-tooltip-content={sidebarCollapsed ? "Expandir" : "Recolher"}
              data-testid="sidebar-toggle"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => setCurrentScreen(item.key)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    currentScreen === item.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                  data-tooltip-id={`nav-${item.key}`}
                  data-tooltip-content={sidebarCollapsed ? `${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}` : undefined}
                >
                  <item.icon size={20} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                          {item.shortcut}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Save button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => useGameStore.getState().saveGame()}
            className="w-full flex items-center gap-3 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            data-tooltip-id="save-game"
            data-tooltip-content={sidebarCollapsed ? "Salvar (Ctrl+S)" : undefined}
          >
            <Settings size={20} />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{t('common.save')}</span>
                <span className="text-xs text-green-200 bg-green-700 px-2 py-1 rounded">
                  Ctrl+S
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Club Assistant */}
        {isAssistantOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <ClubAssistant />
          </div>
        )}
      </div>

      {/* Assistant toggle button */}
      <button
        onClick={toggleAssistant}
        className={clsx(
          'fixed right-4 top-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all',
          isAssistantOpen ? 'rotate-180' : ''
        )}
        data-tooltip-id="assistant-toggle"
        data-tooltip-content={isAssistantOpen ? "Fechar Assistente" : "Abrir Assistente"}
        data-testid="assistant-toggle"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Tooltips */}
      <Tooltip id="sidebar-toggle" />
      <Tooltip id="assistant-toggle" />
      <Tooltip id="save-game" />
      {navigationItems.map((item) => (
        <Tooltip key={`nav-${item.key}`} id={`nav-${item.key}`} />
      ))}
    </div>
  );
};
