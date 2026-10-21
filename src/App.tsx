import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameFrame from './components/GameFrame';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/game.css';

export default function App() {
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