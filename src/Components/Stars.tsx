import React, { useState } from 'react';

type Props = {
  value: number;
  count?: number;
  size?: number;
  edit?: boolean;
  half?: boolean;
  color1?: string;
  color2?: string;
  gap?: number;
  onChange?: (value: number) => void;
};

// SVG-based stars. Uses clipPath per-star to allow partial fills and precise color control.
export default function Stars({
  value,
  count = 5,
  size = 24,
  edit = false,
  half = true,
  color1 = '#cccccc',
  color2 = '#ffd700',
  gap = 6,
  onChange,
}: Props) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const display = hoverVal ?? value;

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
    if (!edit) return;
    if (!half) {
      setHoverVal(index);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const v = percent >= 0.5 ? index : index - 0.5;
    setHoverVal(v);
  };

  const handleMouseLeave = () => {
    if (!edit) return;
    setHoverVal(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
    if (!edit) return;
    let newVal = index;
    if (half) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      newVal = percent >= 0.5 ? index : index - 0.5;
    }
    onChange?.(newVal);
    setHoverVal(newVal);
  };

  // star path (material-like)
  const starPath =
    'm19.555 23.411-6.664-3.285c-.163-.082-.355-.13-.559-.13-.235 0-.455.064-.643.175l.006-.003-6.416 3.75c-.086.05-.19.079-.3.079-.336 0-.609-.273-.609-.609 0-.033.003-.064.007-.096v.003l.994-7.542c.007-.049.011-.105.011-.162 0-.364-.155-.691-.403-.92l-.001-.001-4.571-4.247c-.248-.231-.402-.56-.402-.924 0-.625.454-1.144 1.05-1.246l.007-.001 5.987-1.108c.421-.078.765-.355.935-.727l.003-.008 2.491-5.663c.204-.444.646-.746 1.157-.746.48 0 .897.266 1.114.659l.003.007 2.881 5.471c.197.365.558.62.981.666h.006l6.045.681c.647.061 1.149.601 1.149 1.259 0 .332-.128.635-.338.86l.001-.001-4.27 4.562c-.211.224-.341.527-.341.86 0 .088.009.173.026.256l-.001-.008 1.52 7.453c.009.04.015.086.015.134 0 .337-.273.61-.61.61-.095 0-.185-.022-.265-.061l.004.002z';

  const uidBase = Math.floor(Math.random() * 1e9);

  const stars = [] as React.ReactNode[];
  for (let i = 1; i <= count; i++) {
    const starValue = Math.max(0, Math.min(1, display - (i - 1)));
    const fillPercent = starValue * 100; // 0..100
    const clipWidth = (fillPercent / 100) * 24; // viewBox width is 24
    const clipId = `star-clip-${uidBase}-${i}`;

    stars.push(
      <span
        key={i}
        role={edit ? 'button' : 'img'}
        aria-label={`star-${i}`}
        onMouseMove={(e) => handleMouseMove(e, i)}
        onClick={(e) => handleClick(e, i)}
        onMouseLeave={handleMouseLeave}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 0,
          borderRadius: Math.max(2, size * 0.22),
          background: 'transparent',
          cursor: edit ? 'pointer' : 'default',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', pointerEvents: 'none' }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={clipWidth} height="24" />
            </clipPath>
          </defs>

          {/* base star (drawn first) */}
          <path d={starPath} fill={color1} />

          {/* filled star (clipped) drawn on top */}
          <g clipPath={`url(#${clipId})`}>
            <path d={starPath} fill={color2} />
          </g>
        </svg>
      </span>,
    );
  }

  return (
    <div className="stars-wrapper" style={{ display: 'inline-flex', gap }}>
      {stars}
    </div>
  );
}
