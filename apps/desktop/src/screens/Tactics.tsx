import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Save, Upload, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

interface TacticSetup {
  formation: '4-4-2' | '4-3-3' | '3-5-2';
  mentality: 'defensive' | 'balanced' | 'attacking';
  pressing: 'low' | 'medium' | 'high';
  tempo: 'slow' | 'medium' | 'fast';
  width: 'narrow' | 'normal' | 'wide';
}

const formations = {
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'DL', x: 20, y: 75, label: 'DL' },
      { id: 'DC1', x: 40, y: 75, label: 'DC' },
      { id: 'DC2', x: 60, y: 75, label: 'DC' },
      { id: 'DR', x: 80, y: 75, label: 'DR' },
      { id: 'ML', x: 20, y: 45, label: 'ML' },
      { id: 'MC1', x: 40, y: 45, label: 'MC' },
      { id: 'MC2', x: 60, y: 45, label: 'MC' },
      { id: 'MR', x: 80, y: 45, label: 'MR' },
      { id: 'ST1', x: 40, y: 20, label: 'ST' },
      { id: 'ST2', x: 60, y: 20, label: 'ST' },
    ]
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'DL', x: 20, y: 75, label: 'DL' },
      { id: 'DC1', x: 40, y: 75, label: 'DC' },
      { id: 'DC2', x: 60, y: 75, label: 'DC' },
      { id: 'DR', x: 80, y: 75, label: 'DR' },
      { id: 'MC1', x: 30, y: 50, label: 'MC' },
      { id: 'MC2', x: 50, y: 50, label: 'MC' },
      { id: 'MC3', x: 70, y: 50, label: 'MC' },
      { id: 'LW', x: 20, y: 25, label: 'LW' },
      { id: 'ST', x: 50, y: 20, label: 'ST' },
      { id: 'RW', x: 80, y: 25, label: 'RW' },
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'DC1', x: 30, y: 75, label: 'DC' },
      { id: 'DC2', x: 50, y: 75, label: 'DC' },
      { id: 'DC3', x: 70, y: 75, label: 'DC' },
      { id: 'WBL', x: 15, y: 55, label: 'WBL' },
      { id: 'MC1', x: 35, y: 50, label: 'MC' },
      { id: 'MC2', x: 50, y: 50, label: 'MC' },
      { id: 'MC3', x: 65, y: 50, label: 'MC' },
      { id: 'WBR', x: 85, y: 55, label: 'WBR' },
      { id: 'ST1', x: 40, y: 20, label: 'ST' },
      { id: 'ST2', x: 60, y: 20, label: 'ST' },
    ]
  }
};

export const Tactics: React.FC = () => {
  const { t } = useTranslation();
  const [tactics, setTactics] = useState<TacticSetup>({
    formation: '4-4-2',
    mentality: 'balanced',
    pressing: 'medium',
    tempo: 'medium',
    width: 'normal',
  });

  const [savedTactics, setSavedTactics] = useState<Array<{
    id: string;
    name: string;
    tactics: TacticSetup;
  }>>([
    {
      id: '1',
      name: 'Padrão 4-4-2',
      tactics: {
        formation: '4-4-2',
        mentality: 'balanced',
        pressing: 'medium',
        tempo: 'medium',
        width: 'normal',
      }
    }
  ]);

  const handleTacticChange = <K extends keyof TacticSetup>(
    key: K,
    value: TacticSetup[K]
  ) => {
    setTactics(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const name = prompt('Nome da tática:');
    if (name) {
      const newTactic = {
        id: Date.now().toString(),
        name,
        tactics: { ...tactics },
      };
      setSavedTactics(prev => [...prev, newTactic]);
    }
  };

  const handleLoad = (tacticToLoad: TacticSetup) => {
    setTactics(tacticToLoad);
  };

  const handleReset = () => {
    setTactics({
      formation: '4-4-2',
      mentality: 'balanced',
      pressing: 'medium',
      tempo: 'medium',
      width: 'normal',
    });
  };

  const currentFormation = formations[tactics.formation];

  const getOptionColor = (current: string, option: string) => {
    return current === option 
      ? 'bg-blue-600 text-white border-blue-500' 
      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600';
  };

  return (
    <div className="h-full bg-gray-900 flex">
      {/* Tactical Settings */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Target size={24} className="text-blue-400" />
          <h1 className="text-xl font-semibold text-white">
            {t('tactics.title')}
          </h1>
        </div>

        {/* Formation */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('tactics.formation')}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {Object.keys(formations).map((formation) => (
              <button
                key={formation}
                onClick={() => handleTacticChange('formation', formation as any)}
                className={clsx(
                  'p-3 rounded-lg border transition-colors text-left',
                  getOptionColor(tactics.formation, formation)
                )}
              >
                <div className="font-medium">{formation}</div>
                <div className="text-sm opacity-75">
                  {formation === '4-4-2' && 'Equilibrado e sólido'}
                  {formation === '4-3-3' && 'Ofensivo com largura'}
                  {formation === '3-5-2' && 'Controle do meio-campo'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mentality */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('tactics.mentality')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['defensive', 'balanced', 'attacking'] as const).map((mentality) => (
              <button
                key={mentality}
                onClick={() => handleTacticChange('mentality', mentality)}
                className={clsx(
                  'p-2 rounded border transition-colors text-sm',
                  getOptionColor(tactics.mentality, mentality)
                )}
              >
                {mentality === 'defensive' && 'Defensiva'}
                {mentality === 'balanced' && 'Equilibrada'}
                {mentality === 'attacking' && 'Ofensiva'}
              </button>
            ))}
          </div>
        </div>

        {/* Pressing */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('tactics.pressing')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((pressing) => (
              <button
                key={pressing}
                onClick={() => handleTacticChange('pressing', pressing)}
                className={clsx(
                  'p-2 rounded border transition-colors text-sm',
                  getOptionColor(tactics.pressing, pressing)
                )}
              >
                {pressing === 'low' && 'Baixa'}
                {pressing === 'medium' && 'Média'}
                {pressing === 'high' && 'Alta'}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('tactics.tempo')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'medium', 'fast'] as const).map((tempo) => (
              <button
                key={tempo}
                onClick={() => handleTacticChange('tempo', tempo)}
                className={clsx(
                  'p-2 rounded border transition-colors text-sm',
                  getOptionColor(tactics.tempo, tempo)
                )}
              >
                {tempo === 'slow' && 'Lento'}
                {tempo === 'medium' && 'Médio'}
                {tempo === 'fast' && 'Rápido'}
              </button>
            ))}
          </div>
        </div>

        {/* Width */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('tactics.width')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['narrow', 'normal', 'wide'] as const).map((width) => (
              <button
                key={width}
                onClick={() => handleTacticChange('width', width)}
                className={clsx(
                  'p-2 rounded border transition-colors text-sm',
                  getOptionColor(tactics.width, width)
                )}
              >
                {width === 'narrow' && 'Estreita'}
                {width === 'normal' && 'Normal'}
                {width === 'wide' && 'Ampla'}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Save size={18} />
            {t('tactics.save')}
          </button>
          
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 p-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
            Resetar
          </button>
        </div>

        {/* Saved tactics */}
        {savedTactics.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Táticas Salvas</h3>
            <div className="space-y-2">
              {savedTactics.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleLoad(saved.tactics)}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                >
                  <div className="font-medium text-white">{saved.name}</div>
                  <div className="text-sm text-gray-400">
                    {saved.tactics.formation} • {saved.tactics.mentality}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tactical Visualization */}
      <div className="flex-1 p-6">
        <div className="h-full bg-green-800 rounded-lg relative overflow-hidden">
          {/* Field markings */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-700 to-green-800">
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full"></div>
            
            {/* Penalty areas */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-48 h-20 border-2 border-white/30 border-t-0"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-20 border-2 border-white/30 border-b-0"></div>
            
            {/* Goal areas */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-8 border-2 border-white/30 border-t-0"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-8 border-2 border-white/30 border-b-0"></div>
            
            {/* Center line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
          </div>

          {/* Player positions */}
          {currentFormation.positions.map((position) => (
            <div
              key={position.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              title={position.label}
            >
              {position.label}
            </div>
          ))}

          {/* Formation info overlay */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
            <h3 className="text-lg font-bold mb-2">{currentFormation.name}</h3>
            <div className="space-y-1 text-sm">
              <div>Mentalidade: <span className="text-blue-400">{tactics.mentality}</span></div>
              <div>Pressão: <span className="text-blue-400">{tactics.pressing}</span></div>
              <div>Ritmo: <span className="text-blue-400">{tactics.tempo}</span></div>
              <div>Largura: <span className="text-blue-400">{tactics.width}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
