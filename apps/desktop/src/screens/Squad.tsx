import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface MockPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  condition: number;
  morale: number;
  value: number;
  wage: number;
  attributes: {
    finishing: number;
    pace: number;
    passing: number;
    defending: number;
  };
}

// Mock player data
const mockPlayers: MockPlayer[] = [
  {
    id: 'PLY-001',
    name: 'João Silva',
    position: 'ST',
    age: 24,
    condition: 94,
    morale: 78,
    value: 12000000,
    wage: 8500,
    attributes: { finishing: 16, pace: 14, passing: 12, defending: 8 }
  },
  {
    id: 'PLY-002',
    name: 'Carlos Rodriguez',
    position: 'MC',
    age: 27,
    condition: 91,
    morale: 85,
    value: 9500000,
    wage: 7200,
    attributes: { finishing: 11, pace: 12, passing: 17, defending: 14 }
  },
  {
    id: 'PLY-003',
    name: 'Marco Pereira',
    position: 'DC',
    age: 29,
    condition: 96,
    morale: 72,
    value: 6200000,
    wage: 6800,
    attributes: { finishing: 6, pace: 10, passing: 13, defending: 18 }
  },
  {
    id: 'PLY-004',
    name: 'Andre Santos',
    position: 'GK',
    age: 31,
    condition: 89,
    morale: 80,
    value: 4500000,
    wage: 5500,
    attributes: { finishing: 3, pace: 8, passing: 12, defending: 16 }
  },
];

export const Squad: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const positions = ['GK', 'DC', 'DL', 'DR', 'MC', 'ML', 'MR', 'AMC', 'ST'];

  const filteredPlayers = mockPlayers
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = !positionFilter || player.position === positionFilter;
      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'age':
          aValue = a.age;
          bValue = b.age;
          break;
        case 'condition':
          aValue = a.condition;
          bValue = b.condition;
          break;
        case 'morale':
          aValue = a.morale;
          bValue = b.morale;
          break;
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'wage':
          aValue = a.wage;
          bValue = b.wage;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 90) return 'text-green-400';
    if (condition >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMoraleColor = (morale: number) => {
    if (morale >= 80) return 'text-green-400';
    if (morale >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? 
      <TrendingUp size={16} className="text-blue-400" /> : 
      <TrendingDown size={16} className="text-blue-400" />;
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users size={24} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                {t('squad.title')}
              </h1>
              <p className="text-sm text-gray-400">
                {filteredPlayers.length} jogadores
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none w-64"
                placeholder="Buscar jogador..."
              />
            </div>

            {/* Position filter */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas as posições</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Squad table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.name')}
                  <SortIcon column="name" />
                </div>
              </th>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.position')}
                  <SortIcon column="position" />
                </div>
              </th>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.age')}
                  <SortIcon column="age" />
                </div>
              </th>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('condition')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.condition')}
                  <SortIcon column="condition" />
                </div>
              </th>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('morale')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.morale')}
                  <SortIcon column="morale" />
                </div>
              </th>
              <th className="text-left p-4 text-gray-300 font-medium">
                Atributos
              </th>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.value')}
                  <SortIcon column="value" />
                </div>
              </th>
              <th 
                className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('wage')}
              >
                <div className="flex items-center gap-2">
                  {t('squad.wage')}
                  <SortIcon column="wage" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player, index) => (
              <tr 
                key={player.id}
                className={clsx(
                  'border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors',
                  index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'
                )}
              >
                <td className="p-4">
                  <div className="font-medium text-white">{player.name}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm font-medium">
                    {player.position}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{player.age}</td>
                <td className="p-4">
                  <span className={clsx('font-medium', getConditionColor(player.condition))}>
                    {player.condition}%
                  </span>
                </td>
                <td className="p-4">
                  <span className={clsx('font-medium', getMoraleColor(player.morale))}>
                    {player.morale}%
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-400">FIN {player.attributes.finishing}</span>
                    <span className="text-green-400">PAC {player.attributes.pace}</span>
                    <span className="text-blue-400">PAS {player.attributes.passing}</span>
                    <span className="text-yellow-400">DEF {player.attributes.defending}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-300">
                  {formatCurrency(player.value)}
                </td>
                <td className="p-4 text-gray-300">
                  {formatCurrency(player.wage)}/mês
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              Nenhum jogador encontrado
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Tente ajustar os filtros de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
