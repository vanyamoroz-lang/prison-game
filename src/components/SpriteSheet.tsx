import type { CSSProperties } from 'react';

type SpriteSheetProps = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frame: number;
  columns: number;
  rows: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export function SpriteSheet({
  src,
  frameWidth,
  frameHeight,
  frame,
  columns,
  rows,
  label,
  className,
  style,
}: SpriteSheetProps) {
  const column = frame % columns;
  const row = Math.floor(frame / columns);
  const sheetWidth = frameWidth * columns;
  const sheetHeight = frameHeight * rows;

  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{
        width: frameWidth,
        height: frameHeight,
        backgroundImage: `url(${src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${sheetWidth}px ${sheetHeight}px`,
        backgroundPosition: `${-column * frameWidth}px ${-row * frameHeight}px`,
        ...style,
      }}
    />
  );
}
