import React, { useRef } from 'react';

type Props = {
  name: string;
  value: any;
  onChange: (v: any) => void;
  color?: string;
  onColorChange?: (c: string) => void;
  textarea?: boolean;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  showColorIcon?: boolean;
  icon?: string;
  inputWidth?: string | number;
};

export default function ColoredInput({
  name,
  value,
  onChange,
  color = '#ffffff',
  onColorChange,
  textarea = false,
  type = 'text',
  className = '',
  style = {},
  placeholder = '',
  showColorIcon = true,
  icon = '✏️',
  inputWidth,
}: Props) {
  const colorRef = useRef<HTMLInputElement | null>(null);
  return (
    <div
      className={`colored-input d-flex align-items-center ${className}`}
      style={{ gap: 8, ['--ci-color' as any]: color, ['--ci-btn-color' as any]: color } as React.CSSProperties}
    >
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-100`}
          placeholder={placeholder}
          style={{ ...style, width: inputWidth } as React.CSSProperties}
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={(e) => {
            const v = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
            onChange(v as any);
          }}
          className={`w-100`}
          placeholder={placeholder}
          style={{ ...style, width: inputWidth } as React.CSSProperties}
          type={type}
        />
      )}

      {showColorIcon ? (
        <>
          <button
            type="button"
            className="color-btn"
            onClick={() => colorRef.current?.click()}
            aria-label="Choose color"
            title="Choose color"
          >
            <span className="color-icon">{icon}</span>
          </button>
            <input
              ref={colorRef}
              type="color"
              // position the native color input over the button (invisible) so the picker opens anchored to it
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 28,
                opacity: 0,
                border: 'none',
                padding: 0,
                margin: 0,
                background: 'transparent',
              } as React.CSSProperties}
              value={color}
              onChange={(e) => onColorChange?.(e.target.value)}
            />
        </>
      ) : null}
    </div>
  );
}
