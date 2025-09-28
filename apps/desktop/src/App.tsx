import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { MainMenu } from './screens/MainMenu';
import { NewGame } from './screens/NewGame';
import { Calendar } from './screens/Calendar';
import { Squad } from './screens/Squad';
import { Tactics } from './screens/Tactics';
import { Match } from './screens/Match';
import { Inbox } from './screens/Inbox';
import { Scouting } from './screens/Scouting';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';

// Screen component mapping
const screenComponents = {
  menu: MainMenu,
  newGame: NewGame,
  calendar: Calendar,
  squad: Squad,
  tactics: Tactics,
  match: Match,
  inbox: Inbox,
  scouting: Scouting,
};

export const App: React.FC = () => {
  const { i18n } = useTranslation();
  const { currentScreen, currentGame } = useGameStore();
  const { language } = useUIStore();

  // Update language when UI store changes
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentGame) {
        useGameStore.getState().saveGame();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentGame]);

  const CurrentScreen = screenComponents[currentScreen as keyof typeof screenComponents] || MainMenu;

  // Show menu screens without layout
  if (currentScreen === 'menu' || currentScreen === 'newGame') {
    return (
      <BrowserRouter>
        <div className="h-screen overflow-hidden">
          <CurrentScreen />
        </div>
      </BrowserRouter>
    );
  }

  // Show game screens with layout
  return (
    <BrowserRouter>
      <div className="h-screen overflow-hidden">
        <Layout>
          <CurrentScreen />
        </Layout>
      </div>
    </BrowserRouter>
  );
};
