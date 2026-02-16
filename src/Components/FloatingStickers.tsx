import React, { useRef, useState, useCallback, useEffect } from 'react';
import './index.css';

type Sticker = {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  z: number;
};

export type { Sticker };

type Props = {
  initialStickers?: Sticker[];
  onChange?: (s: Sticker[]) => void;
};

let globalZ = 1000;

export default function FloatingStickers({ initialStickers, onChange }: Props = {}) {
  const [stickers, setStickers] = useState<Sticker[]>(initialStickers || []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    pointerId: number;
    element: HTMLElement | null;
    mode?: 'move' | 'resize' | 'rotate';
    startX?: number;
    startY?: number;
    startW?: number;
    startH?: number;
    startAngle?: number;
  } | null>(null);

  const addStickersFromFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const created = await Promise.all(arr.map(async (f, i) => {
      const url = URL.createObjectURL(f);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url,
        x: 40 + i * 30,
        y: 40 + i * 30,
        width: 160,
        height: 160 * 1.33, // default aspect
        angle: 0,
        z: ++globalZ,
      } as Sticker;
    }));
    setStickers((s) => {
      const res = [...s, ...created];
      return res;
    });
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addStickersFromFiles(e.target.files);
    e.currentTarget.value = '';
  };

  const bringToFront = (id: string) => {
    globalZ++;
    setStickers((s) => s.map(st => st.id === id ? { ...st, z: globalZ } : st));
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    const target = e.currentTarget as HTMLElement;
    try { target.setPointerCapture(e.pointerId); } catch {}
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      pointerId: e.pointerId,
      element: target,
      mode: 'move',
    };
    bringToFront(id);
  };

  const onResizePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    try { target.setPointerCapture(e.pointerId); } catch {}
    const stickerEl = (target.closest('.floating-sticker') as HTMLElement);
    const rect = stickerEl.getBoundingClientRect();
    dragRef.current = {
      id,
      offsetX: e.clientX,
      offsetY: e.clientY,
      pointerId: e.pointerId,
      element: stickerEl,
      mode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
    };
    bringToFront(id);
  };

  const onRotatePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    try { target.setPointerCapture(e.pointerId); } catch {}
    const stickerEl = (target.closest('.floating-sticker') as HTMLElement);
    const rect = stickerEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pointerAng = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const found = stickers.find(s => s.id === id);
    dragRef.current = {
      id,
      offsetX: centerX,
      offsetY: centerY,
      pointerId: e.pointerId,
      element: stickerEl,
      mode: 'rotate',
      startAngle: found?.angle || 0,
      startX: pointerAng,
    };
    bringToFront(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const dr = dragRef.current;
    const { id, offsetX, offsetY, mode } = dr;
    const bounds = containerRef.current.getBoundingClientRect();
    if (mode === 'move') {
      const x = e.clientX - bounds.left - offsetX;
      const y = e.clientY - bounds.top - offsetY;
      setStickers((s) => s.map(st => st.id === id ? { ...st, x: Math.max(0, x), y: Math.max(0, y) } : st));
    } else if (mode === 'resize') {
      const startW = dr.startW || 100;
      const startH = dr.startH || 100;
      const dx = e.clientX - (dr.startX || 0);
      const dy = e.clientY - (dr.startY || 0);
      const minSize = 40;
      setStickers((s) => s.map(st => {
        if (st.id !== id) return st;
        const nw = Math.max(minSize, startW + dx);
        const nh = Math.max(minSize, startH + dy);
        return { ...st, width: nw, height: nh };
      }));
    } else if (mode === 'rotate') {
      const drEl = dr.element;
      if (!drEl) return;
      const rect = drEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const ang = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      const base = dr.startAngle || 0;
      const startPointerAng = dr.startX || 0;
      const delta = ang - startPointerAng;
      const newAngle = Math.round(base + delta);
      setStickers((s) => s.map(st => st.id === id ? { ...st, angle: newAngle } : st));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        dragRef.current.element?.releasePointerCapture(dragRef.current.pointerId);
      } catch {}
      dragRef.current = null;
    }
  };

  const removeSticker = (id: string) => {
    setStickers((s) => {
      const found = s.find(st => st.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return s.filter(st => st.id !== id);
    });
  };

  // avoid notifying parent on initial mount to prevent echo loops
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    onChange?.(stickers);
  }, [stickers, onChange]);

  // initialStickers is used only as the initial state via useState(initialStickers || []),
  // do not re-sync on prop changes to avoid update loops with parent.

  useEffect(() => {
    // cleanup object urls on unmount
    return () => {
      stickers.forEach(st => URL.revokeObjectURL(st.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="floating-stickers-root" ref={containerRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <div className="floating-stickers-controls">
        <label className="btn-small">
          Add stickers
          <input type="file" accept="image/*" multiple onChange={onFileInputChange} style={{ display: 'none' }} />
        </label>
        <button className="btn-small" onClick={() => setStickers([])}>Clear all</button>
      </div>

      {stickers.map((st) => (
        <div
          key={st.id}
          className="floating-sticker"
          style={{ left: `${st.x}px`, top: `${st.y}px`, width: `${st.width}px`, height: `${st.height}px`, zIndex: st.z, transform: `rotate(${st.angle || 0}deg)`, transformOrigin: 'center center' }}
          onPointerDown={(e) => onPointerDown(e, st.id)}
          onDoubleClick={() => removeSticker(st.id)}
        >
          <img src={st.url} alt="sticker" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
          <div className="sticker-handle sticker-handle-rotate" onPointerDown={(e) => onRotatePointerDown(e, st.id)} />
          <div className="sticker-handle sticker-handle-resize" onPointerDown={(e) => onResizePointerDown(e, st.id)} />
        </div>
      ))}
    </div>
  );
}
