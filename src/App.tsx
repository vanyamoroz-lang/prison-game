import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameFrame from './components/GameFrame';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { usePlayer } from './store/playerStore'; // Импортируем стор
import './styles/game.css';

export default function App() {
  // Достаем функцию загрузки из стора
  const fetchPlayerData = usePlayer((state) => state.fetchPlayerData);

  useEffect(() => {
    // Загружаем данные при старте приложения
    fetchPlayerData();
  }, [fetchPlayerData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <div className="page">
                <GameFrame />
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}