import { useEffect, useRef, useState } from 'react';
import TopBar from './TopBar';
import BottomTabs from './BottomTabs';
import FriendsStrip from './FriendsStrip';
import Scene from './Scene';

const W = 1000, H = 640;

export default function GameFrame() {
  const [scale, setScale] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () =>
      setScale(Math.min(window.innerWidth / W, window.innerHeight / H, 1.5));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="frame" ref={ref}
         style={{ width: W, height: H, transform: `scale(${scale})` }}>
      <TopBar />
      <Scene />
      <BottomTabs />
      <FriendsStrip />
    </div>
  );
}