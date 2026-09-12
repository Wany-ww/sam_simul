import { useParams } from 'react-router-dom';

export function GameScreen() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="screen screen-centered">
      <h1>게임 시작!</h1>
      <p>방 {roomId} — 턴 루프/내정 화면은 2단계에서 구현됩니다.</p>
    </div>
  );
}
