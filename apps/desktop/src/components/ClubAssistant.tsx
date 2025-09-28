import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Target,
  Calendar,
  X
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import clsx from 'clsx';

export const ClubAssistant: React.FC = () => {
  const { t } = useTranslation();
  const { assistantSuggestions, removeAssistantSuggestion } = useUIStore();

  const priorityColors = {
    high: 'border-red-500 bg-red-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    low: 'border-blue-500 bg-blue-500/10',
  };

  const priorityIcons = {
    high: AlertCircle,
    medium: TrendingUp,
    low: Calendar,
  };

  const typeIcons = {
    tactic: Target,
    transfer: Users,
    training: TrendingUp,
    match: Calendar,
    contract: Users,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-blue-400">
          {t('assistant.title')}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {t('assistant.suggestions')}
        </p>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {assistantSuggestions.map((suggestion) => {
            const PriorityIcon = priorityIcons[suggestion.priority];
            const TypeIcon = typeIcons[suggestion.type];
            
            return (
              <div
                key={suggestion.id}
                className={clsx(
                  'p-3 rounded-lg border-l-4 transition-all hover:shadow-lg',
                  priorityColors[suggestion.priority]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <TypeIcon size={16} className="text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-white truncate">
                        {suggestion.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        <PriorityIcon 
                          size={14} 
                          className={clsx(
                            suggestion.priority === 'high' && 'text-red-400',
                            suggestion.priority === 'medium' && 'text-yellow-400',
                            suggestion.priority === 'low' && 'text-blue-400'
                          )}
                        />
                        <button
                          onClick={() => removeAssistantSuggestion(suggestion.id)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <X size={12} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      {suggestion.description}
                    </p>
                    
                    {suggestion.action && (
                      <button
                        onClick={suggestion.action}
                        className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {assistantSuggestions.length === 0 && (
            <div className="text-center py-8">
              <Calendar size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Nenhuma sugestão no momento
              </p>
              <p className="text-gray-500 text-xs mt-1">
                O assistente irá sugerir ações baseadas no estado do seu clube
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
            Ver Próximo Jogo
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
            Treinar Equipe
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
            Buscar Jogadores
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
            Ver Finanças
          </button>
        </div>
      </div>
    </div>
  );
};
