import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Star, Plus, Eye, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface ScoutReport {
  id: string;
  playerId: string;
  playerName: string;
  age: number;
  position: string;
  club: string;
  league: string;
  nationality: string;
  rating: number;
  potential: number;
  uncertainty: number; // ±
  estimatedValue: number;
  scoutedBy: string;
  scoutedDate: string;
  notes: string;
  attributes: {
    finishing: number;
    pace: number;
    passing: number;
    defending: number;
  };
}

const mockReports: ScoutReport[] = [
  {
    id: 'SR-001',
    playerId: 'PLY-112',
    playerName: 'João Mendes',
    age: 20,
    position: 'ST',
    club: 'AlbionX FC',
    league: 'AlbionX Premier',
    nationality: 'ALX',
    rating: 82,
    potential: 94,
    uncertainty: 6,
    estimatedValue: 6500000,
    scoutedBy: 'Carlos Martinez',
    scoutedDate: '2024-08-05',
    notes: 'Jovem atacante promissor com excelente finalização. Precisa melhorar o jogo aéreo.',
    attributes: { finishing: 16, pace: 17, passing: 12, defending: 6 }
  },
  {
    id: 'SR-002',
    playerId: 'PLY-245',
    playerName: 'Luis Romero',
    age: 21,
    position: 'MC',
    club: 'IberiaX City',
    league: 'IberiaX Primera',
    nationality: 'IBE',
    rating: 79,
    potential: 88,
    uncertainty: 8,
    estimatedValue: 8000000,
    scoutedBy: 'Pedro Santos',
    scoutedDate: '2024-08-03',
    notes: 'Meio-campista versátil com boa visão de jogo. Pode jogar em várias posições.',
    attributes: { finishing: 11, pace: 13, passing: 16, defending: 14 }
  },
  {
    id: 'SR-003',
    playerId: 'PLY-301',
    playerName: 'Iván Duarte',
    age: 22,
    position: 'DC',
    club: 'LusitaniaX United',
    league: 'LusitaniaX Liga',
    nationality: 'LUX',
    rating: 77,
    potential: 82,
    uncertainty: 10,
    estimatedValue: 4200000,
    scoutedBy: 'Roberto Silva',
    scoutedDate: '2024-08-01',
    notes: 'Zagueiro sólido com boa leitura de jogo. Forte no jogo aéreo.',
    attributes: { finishing: 5, pace: 11, passing: 13, defending: 17 }
  },
];

export const Scouting: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState(mockReports);
  const [selectedReport, setSelectedReport] = useState<ScoutReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [shortlist, setShortlist] = useState<string[]>([]);

  const positions = ['ST', 'MC', 'DC', 'GK', 'ML', 'MR', 'AMC'];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !positionFilter || report.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  const handleAddToShortlist = (playerId: string) => {
    if (!shortlist.includes(playerId)) {
      setShortlist(prev => [...prev, playerId]);
    }
  };

  const handleRemoveFromShortlist = (playerId: string) => {
    setShortlist(prev => prev.filter(id => id !== playerId));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'text-green-400';
    if (rating >= 75) return 'text-blue-400';
    if (rating >= 65) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getPotentialStars = (potential: number) => {
    const stars = Math.ceil(potential / 20);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < stars ? 'text-yellow-400 fill-current' : 'text-gray-600'}
      />
    ));
  };

  return (
    <div className="h-full bg-gray-900 flex">
      {/* Reports list */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Search size={24} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                {t('scouting.title')}
              </h1>
              <p className="text-sm text-gray-400">
                {filteredReports.length} relatórios
              </p>
            </div>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Buscar jogador..."
              />
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas as posições</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports */}
        <div className="flex-1 overflow-y-auto">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={clsx(
                'p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700/50',
                selectedReport?.id === report.id && 'bg-gray-700'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{report.playerName}</h3>
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                      {report.position}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-2">
                    {report.club} • {report.age} anos
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Rating:</span>
                      <span className={getRatingColor(report.rating)}>
                        {report.rating} (±{report.uncertainty})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Potencial:</span>
                      <div className="flex gap-0.5">
                        {getPotentialStars(report.potential)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-green-400 mt-2">
                    {formatCurrency(report.estimatedValue)}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (shortlist.includes(report.playerId)) {
                        handleRemoveFromShortlist(report.playerId);
                      } else {
                        handleAddToShortlist(report.playerId);
                      }
                    }}
                    className={clsx(
                      'p-2 rounded transition-colors',
                      shortlist.includes(report.playerId)
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    )}
                  >
                    <Star size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report details */}
      <div className="w-96 bg-gray-800 border-l border-gray-700">
        {selectedReport ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Detalhes do Relatório
              </h2>
              <button
                onClick={() => handleAddToShortlist(selectedReport.playerId)}
                disabled={shortlist.includes(selectedReport.playerId)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors text-sm"
              >
                <Plus size={16} />
                Shortlist
              </button>
            </div>

            {/* Player info */}
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">{selectedReport.playerName}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Idade:</span>
                    <span className="text-white ml-2">{selectedReport.age}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Posição:</span>
                    <span className="text-white ml-2">{selectedReport.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Clube:</span>
                    <span className="text-white ml-2">{selectedReport.club}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Liga:</span>
                    <span className="text-white ml-2">{selectedReport.league}</span>
                  </div>
                </div>
              </div>

              {/* Ratings */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Avaliação</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating Atual:</span>
                    <span className={getRatingColor(selectedReport.rating)}>
                      {selectedReport.rating} (±{selectedReport.uncertainty})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potencial:</span>
                    <div className="flex gap-0.5">
                      {getPotentialStars(selectedReport.potential)}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor Estimado:</span>
                    <span className="text-green-400">
                      {formatCurrency(selectedReport.estimatedValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Atributos</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Finalização:</span>
                    <span className="text-red-400">{selectedReport.attributes.finishing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Velocidade:</span>
                    <span className="text-green-400">{selectedReport.attributes.pace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Passe:</span>
                    <span className="text-blue-400">{selectedReport.attributes.passing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defesa:</span>
                    <span className="text-yellow-400">{selectedReport.attributes.defending}</span>
                  </div>
                </div>
              </div>

              {/* Scout notes */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Observações</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedReport.notes}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400">
                    Observado por {selectedReport.scoutedBy} em{' '}
                    {new Date(selectedReport.scoutedDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  <Eye size={16} />
                  Observar Novamente
                </button>
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                  <TrendingUp size={16} />
                  Fazer Proposta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                Selecione um relatório
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Escolha um jogador para ver detalhes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
