import { useLayoutEffect, useRef, useState } from 'react';

const STAGE_WIDTH = 1376;
const STAGE_HEIGHT = 768;

type CharacterLayout = {
  scale: number;
  offsetTop: number;
};

export function useCharacterLayout() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<CharacterLayout>({ scale: 1, offsetTop: 0 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const update = () => {
      // clientWidth/clientHeight are layout sizes: they are not affected by
      // the GameFrame's CSS scale, so the inner canvas is not scaled twice.
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;

      const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
      const offsetTop = Math.max(0, height - STAGE_HEIGHT * scale);
      setLayout((prev) =>
        Math.abs(prev.scale - scale) < 0.001 && Math.abs(prev.offsetTop - offsetTop) < 0.5
          ? prev
          : { scale, offsetTop }
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    window.addEventListener('orientationchange', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return { hostRef, scale: layout.scale, offsetTop: layout.offsetTop };
}
