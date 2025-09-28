import { create } from 'zustand';

export interface AssistantSuggestion {
  id: string;
  type: 'tactic' | 'transfer' | 'training' | 'match' | 'contract';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action?: () => void;
}

export interface UIState {
  // Assistant
  isAssistantOpen: boolean;
  assistantSuggestions: AssistantSuggestion[];
  
  // Modals and overlays
  activeModal: string | null;
  modalData: any;
  
  // Navigation
  sidebarCollapsed: boolean;
  
  // Tooltips
  tooltipsEnabled: boolean;
  
  // Keyboard shortcuts
  shortcutsEnabled: boolean;
  
  // Language
  language: 'pt-BR' | 'en';
  
  // Actions
  toggleAssistant: () => void;
  addAssistantSuggestion: (suggestion: AssistantSuggestion) => void;
  removeAssistantSuggestion: (id: string) => void;
  
  openModal: (modalType: string, data?: any) => void;
  closeModal: () => void;
  
  toggleSidebar: () => void;
  toggleTooltips: () => void;
  toggleShortcuts: () => void;
  
  setLanguage: (lang: 'pt-BR' | 'en') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isAssistantOpen: true,
  assistantSuggestions: [
    {
      id: '1',
      type: 'match',
      title: 'Próxima Partida',
      description: 'Prepare a tática para o jogo contra Real Madrid em 2 dias',
      priority: 'high',
    },
    {
      id: '2',
      type: 'transfer',
      title: 'Janela de Transferências',
      description: 'A janela de transferências abre em 5 dias. Considere reforços para o meio-campo.',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'training',
      title: 'Treino de Finalização',
      description: 'Seus atacantes têm baixa precisão. Foque em treinos de finalização.',
      priority: 'low',
    },
  ],
  
  activeModal: null,
  modalData: null,
  sidebarCollapsed: false,
  tooltipsEnabled: true,
  shortcutsEnabled: true,
  language: 'pt-BR',
  
  toggleAssistant: () => {
    set(state => ({ isAssistantOpen: !state.isAssistantOpen }));
  },
  
  addAssistantSuggestion: (suggestion: AssistantSuggestion) => {
    set(state => ({
      assistantSuggestions: [...state.assistantSuggestions, suggestion],
    }));
  },
  
  removeAssistantSuggestion: (id: string) => {
    set(state => ({
      assistantSuggestions: state.assistantSuggestions.filter(s => s.id !== id),
    }));
  },
  
  openModal: (modalType: string, data?: any) => {
    set({ activeModal: modalType, modalData: data });
  },
  
  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },
  
  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
  
  toggleTooltips: () => {
    set(state => ({ tooltipsEnabled: !state.tooltipsEnabled }));
  },
  
  toggleShortcuts: () => {
    set(state => ({ shortcutsEnabled: !state.shortcutsEnabled }));
  },
  
  setLanguage: (lang: 'pt-BR' | 'en') => {
    set({ language: lang });
  },
}));
