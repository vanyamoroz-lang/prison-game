import { usePlayer } from '../store/playerStore';

export default function LeftPanel() {
  const { talents, achievements } = usePlayer();
  return (
    <div className="left-panel">
      <button className="side-btn">🌟 {talents}</button>
      <button className="side-btn">🏆 {achievements}</button>
      <button className="side-btn">📖</button>
    </div>
  );
}