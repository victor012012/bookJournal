import React, { useRef, useState, useEffect } from 'react';
import './index.css';

type Sticker = {
  id: string;
  url: string; // base64 data URL
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

// Compress and convert image File to base64 data URL
// Resizes to max dimension and compresses (PNG for transparency)
function fileToBase64(file: File, maxSize = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Scale down if larger than maxSize
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      // Use PNG for stickers (may have transparency)
      const base64 = canvas.toDataURL('image/png', quality);
      resolve(base64);
    };
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function FloatingStickers({ initialStickers, onChange }: Props = {}) {
  const [stickers, setStickers] = useState<Sticker[]>(initialStickers || []);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  // Sync with initialStickers when they change from parent (e.g., loaded from JSON)
  const prevInitialRef = useRef<string>('');
  useEffect(() => {
    const newJson = JSON.stringify(initialStickers || []);
    if (newJson === prevInitialRef.current) return;

    const incoming = initialStickers || [];
    if (incoming.length > 0) {
      setStickers((prev) => {
        if (prev.length === 0) return incoming;
        const existingIds = new Set(prev.map((s) => s.id));
        const missing = incoming.filter((s) => !existingIds.has(s.id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
    }
    prevInitialRef.current = newJson;
  }, [initialStickers]);

  const addStickersFromFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const created = await Promise.all(arr.map(async (f, i) => {
      const url = await fileToBase64(f);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url,
        x: 40 + i * 30,
        y: 600 + i * 30,
        width: 160,
        height: 160 * 1.33,
        angle: 0,
        z: ++globalZ,
      } as Sticker;
    }));
    setStickers((s) => [...s, ...created]);
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
    // Use actual sticker dimensions from state, not getBoundingClientRect
    // (which returns the bounding box size when rotated)
    const found = stickers.find(s => s.id === id);
    dragRef.current = {
      id,
      offsetX: e.clientX,
      offsetY: e.clientY,
      pointerId: e.pointerId,
      element: stickerEl,
      mode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      startW: found?.width || 100,
      startH: found?.height || 100,
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

  // Use window-level event listeners for drag operations
  // because the container has pointer-events: none
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
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

    const handlePointerUp = () => {
      if (dragRef.current) {
        try {
          dragRef.current.element?.releasePointerCapture(dragRef.current.pointerId);
        } catch {}
        dragRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const askDeleteSticker = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setStickers((s) => s.filter(st => st.id !== deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
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

  return (
    <div className="floating-stickers-root" ref={containerRef}>
      {/* Floating Add Sticker button - fixed position */}
      <label className="floating-add-sticker-btn" title="Add sticker image">
        <span className="sticker-btn-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            <path d="M19 13h-2v2h-2v2h2v2h2v-2h2v-2h-2v-2z" transform="translate(1, 1) scale(0.5)"/>
          </svg>
        </span>
        <input type="file" accept="image/*" multiple onChange={onFileInputChange} style={{ display: 'none' }} />
      </label>

      {stickers.map((st) => (
        <div
          key={st.id}
          className="floating-sticker"
          style={{
            left: `${st.x}px`,
            top: `${st.y}px`,
            width: `${st.width}px`,
            height: `${st.height}px`,
            zIndex: st.z,
            transform: `rotate(${st.angle || 0}deg)`,
            transformOrigin: 'center center',
          }}
          onPointerDown={(e) => onPointerDown(e, st.id)}
        >
          <img src={st.url} alt="sticker" draggable={false} style={{ objectFit: 'fill' }} />
          {/* Delete button */}
          <button
            className="sticker-delete-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => askDeleteSticker(e, st.id)}
            title="Delete sticker"
          >
            ×
          </button>
          {/* Rotate handle with icon */}
          <div
            className="sticker-handle sticker-handle-rotate"
            onPointerDown={(e) => onRotatePointerDown(e, st.id)}
            title="Rotate"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </div>
          {/* Resize handle - bottom right */}
          <div
            className="sticker-handle sticker-handle-resize"
            onPointerDown={(e) => onResizePointerDown(e, st.id)}
            title="Resize"
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM14 22H12V20H14V22ZM22 10H20V8H22V10ZM10 22H8V20H10V22ZM22 6H20V4H22V6ZM6 22H4V20H6V22ZM4 4H22V2H2V22H4V4Z"/>
            </svg>
          </div>
        </div>
      ))}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="sticker-delete-overlay">
          <div className="sticker-delete-dialog">
            <p>Delete this sticker?</p>
            <div className="sticker-delete-actions">
              <button className="btn-confirm-delete" onClick={confirmDelete}>Delete</button>
              <button className="btn-cancel-delete" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
