import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, AlertCircle, Users, Heart, Building, X, Check } from 'lucide-react';
import clsx from 'clsx';

interface InboxMessage {
  id: string;
  type: 'news' | 'transfer' | 'injury' | 'contract' | 'board';
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  requiresAction?: boolean;
  actions?: Array<{
    id: string;
    label: string;
    type: 'accept' | 'reject' | 'negotiate';
  }>;
}

const mockMessages: InboxMessage[] = [
  {
    id: '1',
    type: 'transfer',
    title: 'Oferta por João Silva',
    content: 'Real IberiaX ofereceu €15M por João Silva. O jogador está interessado na transferência.',
    date: '2024-08-10',
    priority: 'high',
    read: false,
    requiresAction: true,
    actions: [
      { id: 'accept', label: 'Aceitar', type: 'accept' },
      { id: 'reject', label: 'Rejeitar', type: 'reject' },
      { id: 'negotiate', label: 'Negociar', type: 'negotiate' },
    ]
  },
  {
    id: '2',
    type: 'injury',
    title: 'Carlos Rodriguez Lesionado',
    content: 'Carlos Rodriguez sofreu uma lesão no joelho durante o treino. Ficará fora por 3-4 semanas.',
    date: '2024-08-09',
    priority: 'medium',
    read: false,
  },
  {
    id: '3',
    type: 'board',
    title: 'Reunião da Diretoria',
    content: 'A diretoria está satisfeita com os resultados recentes, mas espera melhorias na defesa.',
    date: '2024-08-08',
    priority: 'low',
    read: true,
  },
  {
    id: '4',
    type: 'contract',
    title: 'Renovação de Contrato',
    content: 'Marco Pereira gostaria de discutir uma renovação de contrato. Seu atual contrato expira em 2025.',
    date: '2024-08-07',
    priority: 'medium',
    read: true,
    requiresAction: true,
    actions: [
      { id: 'discuss', label: 'Discutir', type: 'negotiate' },
      { id: 'later', label: 'Mais Tarde', type: 'reject' },
    ]
  },
  {
    id: '5',
    type: 'news',
    title: 'Vitória Convincente',
    content: 'A imprensa elogiou a performance da equipe na última partida. O moral dos jogadores aumentou.',
    date: '2024-08-06',
    priority: 'low',
    read: true,
  },
];

export const Inbox: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const messageTypes = [
    { key: 'all', label: 'Todas', icon: Mail },
    { key: 'news', label: 'Notícias', icon: AlertCircle },
    { key: 'transfer', label: 'Transferências', icon: Users },
    { key: 'injury', label: 'Lesões', icon: Heart },
    { key: 'contract', label: 'Contratos', icon: Users },
    { key: 'board', label: 'Diretoria', icon: Building },
  ];

  const filteredMessages = messages.filter(msg => 
    filterType === 'all' || msg.type === filterType
  );

  const unreadCount = messages.filter(msg => !msg.read).length;

  const handleSelectMessage = (message: InboxMessage) => {
    setSelectedMessage(message);
    
    // Mark as read
    if (!message.read) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, read: true } : msg
        )
      );
    }
  };

  const handleAction = (messageId: string, actionId: string) => {
    console.log(`Action ${actionId} for message ${messageId}`);
    // TODO: Implement action handling
    
    // Remove message after action
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setSelectedMessage(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeData = messageTypes.find(t => t.key === type);
    const Icon = typeData?.icon || Mail;
    return <Icon size={16} />;
  };

  return (
    <div className="h-full bg-gray-900 flex">
      {/* Message list */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Mail size={24} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                {t('inbox.title')}
              </h1>
              <p className="text-sm text-gray-400">
                {unreadCount} não lidas
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            {messageTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setFilterType(type.key)}
                className={clsx(
                  'flex items-center gap-2 p-2 rounded text-sm transition-colors',
                  filterType === type.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                <type.icon size={14} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleSelectMessage(message)}
              className={clsx(
                'p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700/50',
                selectedMessage?.id === message.id && 'bg-gray-700',
                !message.read && 'bg-blue-600/5'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(message.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={clsx(
                      'text-sm truncate',
                      message.read ? 'text-gray-300' : 'text-white font-medium'
                    )}>
                      {message.title}
                    </h3>
                    {!message.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(message.date).toLocaleDateString('pt-BR')}
                    </span>
                    {message.requiresAction && (
                      <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded">
                        Ação Necessária
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredMessages.length === 0 && (
            <div className="text-center py-12">
              <Mail size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                Nenhuma mensagem encontrada
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            {/* Message header */}
            <div className={clsx(
              'p-6 border-b border-gray-700 border-l-4',
              getPriorityColor(selectedMessage.priority)
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getTypeIcon(selectedMessage.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {selectedMessage.title}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(selectedMessage.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Message content */}
            <div className="flex-1 p-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Actions */}
              {selectedMessage.actions && (
                <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Ações Disponíveis
                  </h3>
                  <div className="flex gap-3">
                    {selectedMessage.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAction(selectedMessage.id, action.id)}
                        className={clsx(
                          'px-4 py-2 rounded-lg font-medium transition-colors',
                          action.type === 'accept' && 'bg-green-600 hover:bg-green-700 text-white',
                          action.type === 'reject' && 'bg-red-600 hover:bg-red-700 text-white',
                          action.type === 'negotiate' && 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                      >
                        {action.type === 'accept' && <Check size={16} className="inline mr-2" />}
                        {action.type === 'reject' && <X size={16} className="inline mr-2" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No message selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail size={64} className="text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">
                Selecione uma mensagem
              </h2>
              <p className="text-gray-500">
                Escolha uma mensagem da lista para ver o conteúdo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
