import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  Pause, 
  FastForward, 
  SkipForward,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import type { MatchResult, MatchEvent } from '@managerx/core-sim';
import clsx from 'clsx';

interface MatchState {
  isPlaying: boolean;
  speed: 1 | 2 | 4 | 8;
  currentMinute: number;
  result: MatchResult | null;
  events: MatchEvent[];
}

export const Match: React.FC = () => {
  const { t } = useTranslation();
  const { currentGame, simulateMatch } = useGameStore();
  const [matchState, setMatchState] = useState<MatchState>({
    isPlaying: false,
    speed: 1,
    currentMinute: 0,
    result: null,
    events: [],
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock match data
  const mockMatch = {
    id: 'FX-001',
    homeTeam: { id: 'CLB-001', name: 'Seu Clube FC' },
    awayTeam: { id: 'CLB-002', name: 'Real IberiaX' },
    competition: 'IberiaX Primera',
    date: '2024-08-12',
    weather: 'clear' as const,
  };

  const handlePlayPause = () => {
    setMatchState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSpeedChange = (newSpeed: 1 | 2 | 4 | 8) => {
    setMatchState(prev => ({ ...prev, speed: newSpeed }));
  };

  const handleSimulateToEnd = async () => {
    setMatchState(prev => ({ ...prev, isPlaying: false }));
    
    try {
      const result = await simulateMatch(mockMatch.id);
      setMatchState(prev => ({
        ...prev,
        result,
        currentMinute: result.duration,
        events: result.events,
      }));
    } catch (error) {
      console.error('Match simulation failed:', error);
    }
  };

  // Simulation loop
  useEffect(() => {
    if (matchState.isPlaying && matchState.currentMinute < 90) {
      intervalRef.current = setInterval(() => {
        setMatchState(prev => {
          const newMinute = Math.min(90, prev.currentMinute + prev.speed * 0.5);
          
          // Simulate events as we progress
          const newEvents = [...prev.events];
          if (Math.random() < 0.1 * prev.speed) { // Random event chance
            newEvents.push({
              minute: Math.floor(newMinute),
              type: Math.random() > 0.8 ? 'goal' : 'shot',
              team: Math.random() > 0.5 ? 'home' : 'away',
              player: 'Player Name',
              description: 'Event description',
              xG: Math.random() * 0.5,
            });
          }
          
          return {
            ...prev,
            currentMinute: newMinute,
            events: newEvents,
          };
        });
      }, 1000 / matchState.speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchState.isPlaying, matchState.speed, matchState.currentMinute]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const currentScore = {
    home: matchState.events.filter(e => e.type === 'goal' && e.team === 'home').length,
    away: matchState.events.filter(e => e.type === 'goal' && e.team === 'away').length,
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Match header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{mockMatch.homeTeam.name}</div>
              <div className="text-sm text-gray-400">Casa</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {currentScore.home} - {currentScore.away}
              </div>
              <div className="text-sm text-gray-400">
                {Math.floor(matchState.currentMinute)}'
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-white">{mockMatch.awayTeam.name}</div>
              <div className="text-sm text-gray-400">Fora</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">{mockMatch.competition}</div>
            <div className="text-sm text-gray-400">{mockMatch.date}</div>
            <div className="text-sm text-blue-400">Tempo limpo</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Match events */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} />
            Eventos da Partida
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {matchState.events.slice().reverse().map((event, index) => (
              <div
                key={index}
                className={clsx(
                  'p-3 rounded-lg border-l-4',
                  event.type === 'goal' && 'bg-green-600/20 border-green-500',
                  event.type === 'shot' && 'bg-blue-600/20 border-blue-500',
                  event.type === 'yellow_card' && 'bg-yellow-600/20 border-yellow-500',
                  event.type === 'red_card' && 'bg-red-600/20 border-red-500',
                  !['goal', 'shot', 'yellow_card', 'red_card'].includes(event.type) && 'bg-gray-600/20 border-gray-500'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                  <span className="text-sm font-medium text-gray-400">
                    {event.minute}'
                  </span>
                  <span className="text-sm text-white">
                    {event.team === 'home' ? mockMatch.homeTeam.name : mockMatch.awayTeam.name}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {event.description}
                </div>
                {event.xG && (
                  <div className="text-xs text-blue-400 mt-1">
                    xG: {event.xG.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
            
            {matchState.events.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aguardando eventos...</p>
              </div>
            )}
          </div>
        </div>

        {/* Match visualization and controls */}
        <div className="flex-1 flex flex-col">
          {/* Match stats */}
          {matchState.result && (
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="grid grid-cols-5 gap-6 text-center">
                <div>
                  <div className="text-sm text-gray-400">Posse</div>
                  <div className="text-lg font-bold text-white">
                    {matchState.result.stats.possession.home.toFixed(0)}% - {matchState.result.stats.possession.away.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Finalizações</div>
                  <div className="text-lg font-bold text-white">
                    {matchState.result.stats.shots.home} - {matchState.result.stats.shots.away}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">No Alvo</div>
                  <div className="text-lg font-bold text-white">
                    {matchState.result.stats.shotsOnTarget.home} - {matchState.result.stats.shotsOnTarget.away}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">xG</div>
                  <div className="text-lg font-bold text-white">
                    {matchState.result.stats.xG.home.toFixed(1)} - {matchState.result.stats.xG.away.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Faltas</div>
                  <div className="text-lg font-bold text-white">
                    {matchState.result.stats.fouls.home} - {matchState.result.stats.fouls.away}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Match visualization area */}
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-4">
                {currentScore.home} - {currentScore.away}
              </div>
              <div className="text-2xl text-gray-400 mb-8">
                {Math.floor(matchState.currentMinute)}'
              </div>
              
              {matchState.currentMinute >= 90 && (
                <div className="text-lg text-green-400 font-semibold">
                  Fim de Jogo
                </div>
              )}
            </div>
          </div>

          {/* Match controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePlayPause}
                className={clsx(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                  matchState.isPlaying 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                )}
              >
                {matchState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {matchState.isPlaying ? 'Pausar' : 'Continuar'}
              </button>

              {/* Speed controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Velocidade:</span>
                {[1, 2, 4, 8].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed as any)}
                    className={clsx(
                      'px-3 py-2 rounded border transition-colors',
                      matchState.speed === speed
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <button
                onClick={handleSimulateToEnd}
                className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-white"
              >
                <SkipForward size={20} />
                Simular até o Fim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
