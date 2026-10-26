import { useLayoutEffect, useRef, useState } from 'react';
import TopBar from './TopBar';
import BottomTabs from './BottomTabs';
import FriendsStrip from './FriendsStrip';
import Scene from './Scene';

// Базовый макет игры
const BASE_W = 1000;
const BASE_H = 640;
const FRIENDS_H = 70;

// Компактный (планшет) и мобильный макеты
const COMPACT_W = 720;
const COMPACT_H = BASE_H - FRIENDS_H;
const PHONE_W = 400;
const PHONE_H = 720;

const COMPACT_BREAKPOINT = 820; // px, ширина доступного места
const PHONE_BREAKPOINT = 520;

const MAX_SCALE = 1.5;

export default function GameFrame() {
  const fitRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // Меряем именно контейнер, а не window: так макет не «прыгает»
  // из-за скроллбаров, адресной строки мобильного браузера и т.п.
  useLayoutEffect(() => {
    const element = fitRef.current;
    if (!element) return;

    const update = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setViewport((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('orientationchange', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const isPhone = viewport.width > 0 && viewport.width < PHONE_BREAKPOINT;
  const isCompact = viewport.width > 0 && viewport.width < COMPACT_BREAKPOINT;

  const designWidth = isPhone ? PHONE_W : isCompact ? COMPACT_W : BASE_W;
  const designHeight = isPhone ? PHONE_H : isCompact ? COMPACT_H : BASE_H;

  const scale =
    viewport.width > 0 && viewport.height > 0
      ? Math.min(viewport.width / designWidth, viewport.height / designHeight, MAX_SCALE)
      : 1;

  const frameClass = [
    'frame',
    isCompact ? 'frame--compact' : '',
    isPhone ? 'frame--phone' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="frame-fit" ref={fitRef}>
      <div
        className="frame-scaler"
        style={{ width: designWidth * scale, height: designHeight * scale }}
      >
        <div
          className={frameClass}
          style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }}
        >
          <TopBar />
          <Scene />
          <BottomTabs />
          {!isCompact && <FriendsStrip />}
        </div>
      </div>
    </div>
  );
}
