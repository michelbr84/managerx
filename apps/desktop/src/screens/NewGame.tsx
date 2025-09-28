import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, Star } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';

// Mock data - will be replaced with actual data from @managerx/content
const mockLeagues = [
  { id: 'LEA-A', name: 'AlbionX Premier League', nationality: 'ALX' },
  { id: 'LEA-B', name: 'LusitaniaX Liga', nationality: 'LUX' },
  { id: 'LEA-C', name: 'CaledoniaX Championship', nationality: 'CAL' },
  { id: 'LEA-D', name: 'IberiaX Primera', nationality: 'IBE' },
  { id: 'LEA-E', name: 'ItalicaX Serie A', nationality: 'ITA' },
  { id: 'LEA-F', name: 'GermanicaX Bundesliga', nationality: 'GER' },
];

const mockClubs = [
  { id: 'CLB-0001', name: 'AlbionX FC', league: 'LEA-A', division: 'D1', reputation: 85 },
  { id: 'CLB-0002', name: 'United AlbionX', league: 'LEA-A', division: 'D1', reputation: 90 },
  { id: 'CLB-0036', name: 'LusitaniaX Porto', league: 'LEA-B', division: 'D1', reputation: 82 },
  { id: 'CLB-0069', name: 'CaledoniaX Celtic', league: 'LEA-C', division: 'D1', reputation: 87 },
  { id: 'CLB-0103', name: 'Real IberiaX', league: 'LEA-D', division: 'D1', reputation: 95 },
  { id: 'CLB-0137', name: 'AC ItalicaX', league: 'LEA-E', division: 'D1', reputation: 92 },
];

export const NewGame: React.FC = () => {
  const { t } = useTranslation();
  const { setCurrentScreen, createNewGame } = useGameStore();
  const [step, setStep] = useState(1);
  const [managerName, setManagerName] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleBack = () => {
    if (step === 1) {
      setCurrentScreen('menu');
    } else {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleStartGame = async () => {
    if (managerName && selectedClub) {
      await createNewGame(managerName, selectedClub);
    }
  };

  const filteredClubs = mockClubs.filter(club => {
    const matchesLeague = !selectedLeague || club.league === selectedLeague;
    const matchesSearch = !searchTerm || 
      club.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLeague && matchesSearch;
  });

  const getReputationStars = (reputation: number) => {
    const stars = Math.ceil(reputation / 20);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < stars ? 'text-yellow-400 fill-current' : 'text-gray-600'}
      />
    ));
  };

  return (
    <div className="h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {t('newGame.title')}
            </h1>
            <p className="text-sm text-gray-400">
              Passo {step} de 3
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Step 1: Manager Details */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Detalhes do Técnico
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('newGame.managerName')}
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('newGame.difficulty')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Fácil', 'Normal', 'Difícil'].map((difficulty) => (
                    <button
                      key={difficulty}
                      className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-white">{difficulty}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {difficulty === 'Fácil' && 'Recursos extras'}
                        {difficulty === 'Normal' && 'Experiência balanceada'}
                        {difficulty === 'Difícil' && 'Máximo desafio'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!managerName}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select League */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('newGame.selectLeague')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league.id);
                    handleNext();
                  }}
                  className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-left"
                >
                  <div className="font-semibold text-white text-lg">
                    {league.name}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {league.nationality}
                  </div>
                  <div className="text-blue-400 text-sm mt-2">
                    34 clubes • 2 divisões
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Club */}
        {step === 3 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('newGame.selectClub')}
            </h2>
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Buscar clube..."
                />
              </div>
            </div>

            {/* Clubs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredClubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClub(club.id)}
                  className={`p-4 border rounded-lg transition-colors text-left ${
                    selectedClub === club.id
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold text-white">
                    {club.name}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {club.division} • {mockLeagues.find(l => l.id === club.league)?.name}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getReputationStars(club.reputation)}
                    <span className="text-xs text-gray-400 ml-2">
                      {club.reputation}/100
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Start button */}
            <button
              onClick={handleStartGame}
              disabled={!selectedClub}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium text-lg transition-colors"
            >
              {t('newGame.start')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
