import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Plus, FolderOpen, Settings, X } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';

export const MainMenu: React.FC = () => {
  const { t } = useTranslation();
  const { saves, setCurrentScreen, loadGame } = useGameStore();

  const handleNewGame = () => {
    setCurrentScreen('newGame');
  };

  const handleLoadGame = (saveId: string) => {
    loadGame(saveId);
  };

  const handleSettings = () => {
    setCurrentScreen('settings');
  };

  const handleExit = () => {
    // TODO: Implement exit confirmation
    window.close();
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-4xl mx-auto p-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-blue-400 mb-4">
            {t('app.title')}
          </h1>
          <p className="text-xl text-gray-400">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main actions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('navigation.menu')}
            </h2>

            {/* Continue Game */}
            {saves.length > 0 && (
              <button
                onClick={() => handleLoadGame(saves[0].id)}
                className="w-full flex items-center gap-4 p-6 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors group"
              >
                <Play size={24} className="text-blue-200 group-hover:text-white" />
                <div className="text-left">
                  <div className="text-lg font-semibold text-white">
                    {t('menu.continueGame')}
                  </div>
                  <div className="text-sm text-blue-200">
                    {saves[0].managerName} • {saves[0].clubId}
                  </div>
                </div>
              </button>
            )}

            {/* New Game */}
            <button
              onClick={handleNewGame}
              className="w-full flex items-center gap-4 p-6 bg-green-600 hover:bg-green-700 rounded-lg transition-colors group"
            >
              <Plus size={24} className="text-green-200 group-hover:text-white" />
              <div className="text-left">
                <div className="text-lg font-semibold text-white">
                  {t('menu.newGame')}
                </div>
                <div className="text-sm text-green-200">
                  Inicie uma nova carreira
                </div>
              </div>
            </button>

            {/* Load Game */}
            <button
              onClick={() => setCurrentScreen('loadGame')}
              className="w-full flex items-center gap-4 p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
            >
              <FolderOpen size={24} className="text-gray-400 group-hover:text-white" />
              <div className="text-left">
                <div className="text-lg font-semibold text-white">
                  {t('menu.loadGame')}
                </div>
                <div className="text-sm text-gray-400">
                  {saves.length} saves disponíveis
                </div>
              </div>
            </button>

            {/* Settings */}
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-4 p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
            >
              <Settings size={24} className="text-gray-400 group-hover:text-white" />
              <div className="text-left">
                <div className="text-lg font-semibold text-white">
                  {t('menu.settings')}
                </div>
                <div className="text-sm text-gray-400">
                  Configurações do jogo
                </div>
              </div>
            </button>

            {/* Exit */}
            <button
              onClick={handleExit}
              className="w-full flex items-center gap-4 p-6 bg-red-600 hover:bg-red-700 rounded-lg transition-colors group"
            >
              <X size={24} className="text-red-200 group-hover:text-white" />
              <div className="text-left">
                <div className="text-lg font-semibold text-white">
                  {t('menu.exit')}
                </div>
                <div className="text-sm text-red-200">
                  Sair do ManagerX
                </div>
              </div>
            </button>
          </div>

          {/* Recent saves */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Saves Recentes
            </h2>

            {saves.length > 0 ? (
              <div className="space-y-3">
                {saves.slice(0, 5).map((save) => (
                  <div
                    key={save.id}
                    className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border border-gray-700"
                    onClick={() => handleLoadGame(save.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {save.managerName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {save.clubId} • Temporada {save.season}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(save.lastPlayed).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Play size={20} className="text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  Nenhum save encontrado
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Inicie um novo jogo para começar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
