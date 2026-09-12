import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginScreen } from './screens/LoginScreen/LoginScreen';
import { LobbyScreen } from './screens/LobbyScreen/LobbyScreen';
import { RoomScreen } from './screens/RoomScreen/RoomScreen';
import { GameScreen } from './screens/GameScreen/GameScreen';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/lobby" element={<LobbyScreen />} />
      <Route path="/room/:roomId" element={<RoomScreen />} />
      <Route path="/game/:roomId" element={<GameScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
