import React, { useRef, useLayoutEffect, useEffect, useCallback } from 'react';

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
  defaultHeight?: string | number;
  savedHeight?: number;
  onHeightChange?: (h: number) => void;
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
  defaultHeight,
  savedHeight,
  onHeightChange,
}: Props) {
  const colorRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const userHeightRef = useRef<number | null>(null);
  const isInitRef = useRef(true);
  const isProgrammaticResize = useRef(false);
  const colorDebounceRef = useRef<number | null>(null);
  const pendingColorRef = useRef<string>(color);

  // Debounced color change handler
  const handleColorChange = useCallback((newColor: string) => {
    pendingColorRef.current = newColor;
    if (colorDebounceRef.current) {
      window.clearTimeout(colorDebounceRef.current);
    }
    colorDebounceRef.current = window.setTimeout(() => {
      onColorChange?.(pendingColorRef.current);
      colorDebounceRef.current = null;
    }, 150) as unknown as number;
  }, [onColorChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (colorDebounceRef.current) {
        window.clearTimeout(colorDebounceRef.current);
      }
    };
  }, []);

  // Auto-grow: ensure content fits but allow user to manually resize
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Get content height
    el.style.height = 'auto';
    const contentH = el.scrollHeight;

    // Parse defaultHeight
    let defH = 0;
    if (defaultHeight !== undefined) {
      if (typeof defaultHeight === 'number') defH = defaultHeight;
      else if (typeof defaultHeight === 'string') defH = parseFloat(defaultHeight) || 0;
    }

    let finalH: number;

    if (isInitRef.current || (savedHeight && savedHeight > 0 && userHeightRef.current === null)) {
      // First render OR savedHeight just arrived from parent (loaded from JSON)
      // and user hasn't manually resized yet
      const initH = (savedHeight && savedHeight > 0) ? savedHeight : defH;
      finalH = Math.max(contentH, initH);
      isInitRef.current = false;
    } else if (userHeightRef.current !== null) {
      // User manually resized: respect their choice but ensure content fits
      finalH = Math.max(contentH, userHeightRef.current);
    } else {
      // Normal auto-grow: only expand if content is bigger, allow shrink to content
      finalH = Math.max(contentH, defH);
    }

    // Set flag to prevent ResizeObserver from treating this as user resize
    isProgrammaticResize.current = true;
    el.style.height = `${finalH}px`;
    // Clear flag after a short delay (ResizeObserver is async)
    requestAnimationFrame(() => {
      isProgrammaticResize.current = false;
    });
  }, [value, defaultHeight, savedHeight]);

  // Track manual resize via ResizeObserver
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let lastH = el.offsetHeight;

    const observer = new ResizeObserver((entries) => {
      // Skip if this resize was triggered programmatically
      if (isProgrammaticResize.current) return;
      
      for (const entry of entries) {
        const newH = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        // Only save if user dragged (not from our effect)
        if (Math.abs(newH - lastH) > 1) {
          userHeightRef.current = newH;
          onHeightChange?.(newH);
          lastH = newH;
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div
      className={`colored-input d-flex align-items-center ${className}`}
      style={{ gap: 8, ['--ci-color' as any]: color, ['--ci-btn-color' as any]: color } as React.CSSProperties}
    >
      {textarea ? (
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-100`}
          placeholder={placeholder}
          style={{
            ...style,
            width: inputWidth,
            resize: 'vertical',
            overflowY: 'hidden',
            fontSize: '18px',
          } as React.CSSProperties}
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={(e) => {
            const v = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
            onChange(v as any);
          }}
          className={`w-100 fs-5`}
          placeholder={placeholder}
          style={{
            ...style,
            width: inputWidth,
          } as React.CSSProperties}
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
              ...style,
            } as React.CSSProperties}
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </>
      ) : null}
    </div>
  );
}
