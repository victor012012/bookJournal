import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import Stars from './Stars';
import ColoredInput from './ColoredInput';
import FloatingStickers, { Sticker as StickerType } from './FloatingStickers';
import './index.css';

// Compress and convert image File to base64 data URL
// Resizes to max 800px and compresses as JPEG
function fileToBase64(file: File, maxSize = 800, quality = 0.7): Promise<string> {
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
      // Use JPEG for smaller size (PNG for transparency if needed)
      const base64 = canvas.toDataURL('image/jpeg', quality);
      resolve(base64);
    };
    // Read file as data URL to load into Image
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Compress and convert sticker image File to base64 data URL
// Resizes to max 400px and uses PNG (stickers may have transparency)
function stickerFileToBase64(file: File, maxSize = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
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

type Props = {
  onClose: () => void;
  defaultCategory?: 'novels' | 'series';
  initialData?: {
    id?: string;
    category?: 'novels' | 'series' | string;
    title?: string;
    author?: string;
    summary?: string;
    publishDate?: string;
    rating?: number;
    coverUrl?: string;
    bookReview?: string;
    pages?: string;
    readability?: number;
    endDate?: string;
    dataAdditional?: string;
    content?: number;
    formats?: {
      hardcover?: boolean;
      paperback?: boolean;
      ebook?: boolean;
      audiobook?: boolean;
    };
  };
};

export default function BookForm({ onClose }: Props) {
  // Note: `initialData` will be applied on mount if provided
  // (declared in the function signature below to keep types consistent)
  const initialData = (arguments[0] as any)?.initialData as
    | {
        id?: string;
        category?: 'novels' | 'series' | string;
        title?: string;
        author?: string;
        summary?: string;
        rating?: number;
        readability?: number;
        plotDevelopment?: number;
        characters?: number;
        publishDate?: string;
        coverUrl?: string;
        pages?: string;
        endDate?: string;
        bookReview?: string;
        dataAdditional?: string;
        writingStyle?: number;
        content?: number;
        formats?: {
          hardcover?: boolean;
          paperback?: boolean;
          ebook?: boolean;
          audiobook?: boolean;
        };
      }
    | undefined;

  const defaultCategory =
    (((arguments[0] as any)?.defaultCategory as 'novels' | 'series' | undefined) ?? 'novels');

  type State = {
    id: string | null;
    category: 'novels' | 'series';
    title: string;
    author: string;
    genre: string;
    publishDate: string;
    summary: string;
    summaryColor: string;
    format: string;
    rating: number;
    characters: number;
    plotDevelopment: number;
    readability: number;
    pages: string;
    endDate: string;
    bookReview: string;
    bookReviewColor: string;
    dataAdditional: string;
    dataAdditionalColor: string;
    summaryHeight?: number;
    bookReviewHeight?: number;
    dataAdditionalHeight?: number;
    writingStyle: number;
    cover: File | null;
    previewUrl: string | null;
    content: number;
    stickers: StickerType[];
    inputColors: { [key: string]: string };
    dragging: boolean;
    closing: boolean;
    saveStatus: 'idle' | 'saving' | 'saved';
  };

  const [state, setState] = useState<State>({
    id: null,
    category: defaultCategory,
    title: '',
    author: '',
    genre: '',
    publishDate: '',
    summary: '',
    summaryColor: 'rgb(220, 220, 170)',
    format: '',
    rating: 0,
    writingStyle: 0,
    content: 0,
    plotDevelopment: 0,
    characters: 0,
    readability: 0,
    pages: '',
    endDate: '',
    bookReview: '',
    bookReviewColor: 'rgb(77, 201, 176)',
    dataAdditional: '',
    dataAdditionalColor: 'rgb(206, 136, 94)',
    summaryHeight: undefined,
    bookReviewHeight: undefined,
    dataAdditionalHeight: undefined,
    cover: null,
    previewUrl: null,
    inputColors: {},
    stickers: [],
    dragging: false,
    closing: false,
    saveStatus: 'idle',
  });

  const [stickerDragOver, setStickerDragOver] = useState(false);
  const [showStickerDropOverlay, setShowStickerDropOverlay] = useState(false);

  
  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  type RatingField =
    | 'content'
    | 'writingStyle'
    | 'readability'
    | 'plotDevelopment'
    | 'characters';

  const [ratingEdit, setRatingEdit] = useState<{
    field: RatingField | null;
    value: string;
  }>({ field: null, value: '' });

  const parseRating = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const ratingInputValue = (field: RatingField, numericValue: number) =>
    ratingEdit.field === field ? ratingEdit.value : numericValue;

  const handleRatingFocus = (field: RatingField) => (e: any) => {
    const cur = Number((state as any)[field] ?? 0);
    setRatingEdit({ field, value: cur === 0 ? '' : String(cur) });
    if (e?.target?.select) e.target.select();
  };

  const handleRatingChange = (field: RatingField) => (e: any) => {
    const raw = String(e?.target?.value ?? '');
    setRatingEdit({ field, value: raw });
    const parsed = parseRating(raw);
    if (parsed !== null) set({ [field]: parsed } as any);
  };

  const handleRatingBlur = (field: RatingField) => (e: any) => {
    const raw = String(e?.target?.value ?? '');
    const parsed = parseRating(raw);
    set({ [field]: parsed ?? 0 } as any);
    setRatingEdit((prev) => (prev.field === field ? { field: null, value: '' } : prev));
  };

  const setInputColor = (key: string, color: string) => {
    setState((s) => {
      const prev = (s.inputColors || {})[key];
      if (prev === color) return s;
      return { ...s, inputColors: { ...(s.inputColors || {}), [key]: color } };
    });
  };
  // if initialData provided, apply to state on mount
  useEffect(() => {
    if (!initialData) return;
    const patch: Partial<State> = {};
    if (initialData.id) patch.id = initialData.id;
    const incomingCategory = String((initialData as any).category ?? '').toLowerCase();
    patch.category =
      incomingCategory === 'series'
        ? 'series'
        : incomingCategory === 'novels'
          ? 'novels'
          : defaultCategory;
    if (initialData.title) patch.title = initialData.title;
    if (initialData.author) patch.author = initialData.author;
    if ((initialData as any).genre) patch.genre = (initialData as any).genre;
    if (initialData.publishDate) patch.publishDate = initialData.publishDate;
    if (initialData.bookReview) patch.bookReview = initialData.bookReview;
    if (initialData.dataAdditional)
      patch.dataAdditional = initialData.dataAdditional;
    if ((initialData as any).summaryColor) patch.summaryColor = (initialData as any).summaryColor;
    if ((initialData as any).bookReviewColor) patch.bookReviewColor = (initialData as any).bookReviewColor;
    if ((initialData as any).dataAdditionalColor) patch.dataAdditionalColor = (initialData as any).dataAdditionalColor;
    if (initialData.summary) patch.summary = initialData.summary;
    if (initialData.pages) patch.pages = initialData.pages;
    if (initialData.endDate) patch.endDate = initialData.endDate;
    if (initialData.content) patch.content = initialData.content;
    if (initialData.writingStyle) patch.writingStyle = initialData.writingStyle;
    if (initialData.rating) patch.rating = initialData.rating;
    if (initialData.coverUrl) patch.previewUrl = initialData.coverUrl;
    if (initialData.plotDevelopment)
      patch.plotDevelopment = initialData.plotDevelopment;
    if (initialData.readability) patch.readability = initialData.readability;
    if (initialData.characters) patch.characters = initialData.characters;
    if ((initialData as any).summaryHeight) patch.summaryHeight = (initialData as any).summaryHeight;
    if ((initialData as any).bookReviewHeight) patch.bookReviewHeight = (initialData as any).bookReviewHeight;
    if ((initialData as any).dataAdditionalHeight) patch.dataAdditionalHeight = (initialData as any).dataAdditionalHeight;
    // accept either object shape or string for backwards compatibility
    if ((initialData as any).format) {
      patch.format = (initialData as any).format;
    } else if (initialData.formats) {
      if (typeof initialData.formats === 'string')
        patch.format = initialData.formats as any;
      else {
        const f = initialData.formats;
        patch.format = f.hardcover
          ? 'hardcover'
          : f.paperback
            ? 'paperback'
            : f.ebook
              ? 'ebook'
              : f.audiobook
                ? 'audiobook'
                : '';
      }
    }
    if ((initialData as any).inputColors) patch.inputColors = (initialData as any).inputColors;
    if ((initialData as any).stickers) patch.stickers = (initialData as any).stickers;
    set(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // debounce ref for autosave
  const debounceRef = useRef<number | null>(null);
  const stickerDragOverTimeoutRef = useRef<number | null>(null);
  const stickerGlobalDragTimeoutRef = useRef<number | null>(null);

  const looksLikeImageName = (name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.bmp') ||
      lower.endsWith('.svg') ||
      lower.endsWith('.avif')
    );
  };

  const isImageDrag = (dt: DataTransfer | null) => {
    if (!dt) return false;

    // Some environments already populate dt.files during dragover.
    const files = Array.from(dt.files || []);
    if (files.length > 0) {
      return files.some((f) => (f.type || '').startsWith('image/') || looksLikeImageName(f.name || ''));
    }

    const items = Array.from(dt.items || []);
    if (items.length > 0) {
      return items.some((it) => {
        if (it.kind !== 'file') return false;
        if ((it.type || '').startsWith('image/')) return true;
        // On Windows/Electron, it.type can be empty until drop.
        const f = typeof it.getAsFile === 'function' ? it.getAsFile() : null;
        if (!f) return false;
        return (f.type || '').startsWith('image/') || looksLikeImageName(f.name || '');
      });
    }
    return false;
  };

  const isFileDrag = (dt: DataTransfer | null) => {
    if (!dt) return false;
    if (dt.files && dt.files.length > 0) return true;
    const types = Array.from(dt.types || []);
    if (types.includes('Files')) return true;
    const items = Array.from(dt.items || []);
    return items.some((it) => it.kind === 'file');
  };

  const buildPayload = () => ({
    id: state.id,
    category: state.category,
    title: state.title,
    author: state.author,
    genre: state.genre,
    publishDate: state.publishDate,
    summary: state.summary,
    pages: state.pages,
    endDate: state.endDate,
    bookReview: state.bookReview,
    dataAdditional: state.dataAdditional,
    rating: state.rating,
    content: state.content,
    writingStyle: state.writingStyle,
    plotDevelopment: state.plotDevelopment,
    characters: state.characters,
    readability: state.readability,
    coverUrl: state.previewUrl,
    format: state.format,
    summaryColor: state.summaryColor,
    bookReviewColor: state.bookReviewColor,
    dataAdditionalColor: state.dataAdditionalColor,
    inputColors: state.inputColors,
    stickers: state.stickers,
    summaryHeight: state.summaryHeight,
    bookReviewHeight: state.bookReviewHeight,
    dataAdditionalHeight: state.dataAdditionalHeight,
  });

  // Debounced autosave - watches all data fields (not UI state like dragging, closing, saveStatus)
  useEffect(() => {
    // Skip saving on initial mount or when no meaningful data
    if (!state.title && !state.author && !state.summary && !state.bookReview) {
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      const payload = buildPayload();
      try {
        set({ saveStatus: 'saving' });
        if (window.api?.saveJSON) {
          const returnedId = await window.api.saveJSON(payload);
          if (!state.id && returnedId) set({ id: returnedId });
        }
        set({ saveStatus: 'saved' });
        setTimeout(() => set({ saveStatus: 'idle' }), 1200);
      } catch (e) {
        console.error('Auto-save failed', e);
        set({ saveStatus: 'idle' });
      }
      debounceRef.current = null;
    }, 1000) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [
    // Only data fields that should trigger save - NOT UI state
    // Note: state.id is NOT included to avoid loop when ID is assigned after first save
    state.category,
    state.title,
    state.author,
    state.genre,
    state.publishDate,
    state.summary,
    state.pages,
    state.endDate,
    state.bookReview,
    state.dataAdditional,
    state.rating,
    state.content,
    state.writingStyle,
    state.plotDevelopment,
    state.characters,
    state.readability,
    state.previewUrl,
    state.format,
    state.summaryColor,
    state.bookReviewColor,
    state.dataAdditionalColor,
    // Stringify complex objects to avoid reference comparison issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(state.inputColors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(state.stickers),
    state.summaryHeight,
    state.bookReviewHeight,
    state.dataAdditionalHeight,
  ]);

  // Convert cover File to base64 when a File is set
  useEffect(() => {
    if (!state.cover) {
      // keep existing previewUrl if it was set from initialData
      return;
    }
    // Convert to base64 for persistence
    fileToBase64(state.cover).then((base64) => {
      set({ previewUrl: base64, cover: null }); // clear cover File after conversion
    });
  }, [state.cover]);

  useEffect(() => {
    const nums = [
      state.content,
      state.plotDevelopment,
      state.characters,
      state.readability,
      state.writingStyle,
    ].map((n) => Number(n) || 0);
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const newRating = Math.round(avg * 10) / 10; // one decimal place as number
    // Only update if value changed to avoid infinite loops
    setState((prev) => {
      if (prev.rating === newRating) return prev;
      return { ...prev, rating: newRating };
    });
  }, [
    state.content,
    state.plotDevelopment,
    state.characters,
    state.readability,
    state.writingStyle,
  ]);

  const handleClose = () => set({ closing: true });

  // Memoized handler for FloatingStickers to prevent unnecessary re-renders
  const handleStickersChange = useCallback((s: StickerType[]) => {
    setState((prev) => {
      // Only update if stickers actually changed
      if (JSON.stringify(prev.stickers) === JSON.stringify(s)) return prev;
      return { ...prev, stickers: s };
    });
  }, []);

  const onAnimationEnd = () => {
    if (state.closing) onClose();
  };

  const onCoverClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) set({ cover: f });
  };

  const onDragOverCover = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set({ dragging: true });
  };

  const onDragLeaveCover = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set({ dragging: false });
  };

  const onDropCover = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set({ dragging: false });
    const f = e.dataTransfer.files?.[0];
    if (f) set({ cover: f });
  };

  const onDragOverStickerZone = (e: React.DragEvent) => {
    if (!isFileDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.stopPropagation();

    setShowStickerDropOverlay(true);
    const imageDrag = isImageDrag(e.dataTransfer);
    setStickerDragOver(imageDrag);

    if (stickerDragOverTimeoutRef.current) {
      window.clearTimeout(stickerDragOverTimeoutRef.current);
    }

    if (imageDrag) {
      // DragOver fires continuously; this prevents the UI from getting "stuck" in dragover state.
      stickerDragOverTimeoutRef.current = window.setTimeout(() => {
        setStickerDragOver(false);
        stickerDragOverTimeoutRef.current = null;
      }, 150) as unknown as number;
    } else {
      stickerDragOverTimeoutRef.current = null;
    }
  };

  const onDragLeaveStickerZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStickerDragOver(false);

    if (stickerDragOverTimeoutRef.current) {
      window.clearTimeout(stickerDragOverTimeoutRef.current);
      stickerDragOverTimeoutRef.current = null;
    }
  };

  const onDropStickerZone = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStickerDragOver(false);
    setShowStickerDropOverlay(false);

    if (stickerDragOverTimeoutRef.current) {
      window.clearTimeout(stickerDragOverTimeoutRef.current);
      stickerDragOverTimeoutRef.current = null;
    }

    const files = Array.from(e.dataTransfer.files || []).filter(
      (f) => (f.type || '').startsWith('image/') || looksLikeImageName(f.name || ''),
    );
    if (files.length === 0) return;

    const overlay = document.querySelector('.floating-stickers-root') as HTMLElement | null;
    const overlayRect = overlay?.getBoundingClientRect();
    const baseX = overlayRect ? e.clientX - overlayRect.left : 40;
    const baseY = overlayRect ? e.clientY - overlayRect.top : 600;

    const urls = await Promise.all(files.map((f) => stickerFileToBase64(f)));

    setState((prev) => {
      const maxZ = Math.max(1000, ...(prev.stickers || []).map((s) => s.z || 0));
      const created: StickerType[] = urls.map((url, i) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url,
        x: Math.max(0, baseX - 80 + i * 20),
        y: Math.max(0, baseY - 80 + i * 20),
        width: 160,
        height: 160 * 1.33,
        angle: 0,
        z: maxZ + 1 + i,
      }));
      return { ...prev, stickers: [...(prev.stickers || []), ...created] };
    });
  };

  useEffect(() => {
    return () => {
      if (stickerDragOverTimeoutRef.current) {
        window.clearTimeout(stickerDragOverTimeoutRef.current);
        stickerDragOverTimeoutRef.current = null;
      }
      if (stickerGlobalDragTimeoutRef.current) {
        window.clearTimeout(stickerGlobalDragTimeoutRef.current);
        stickerGlobalDragTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      e.preventDefault();
      setShowStickerDropOverlay(true);
      setStickerDragOver(isImageDrag(e.dataTransfer));

      if (stickerGlobalDragTimeoutRef.current) {
        window.clearTimeout(stickerGlobalDragTimeoutRef.current);
      }
      // If the drag leaves the window or stops firing events, hide the overlay.
      stickerGlobalDragTimeoutRef.current = window.setTimeout(() => {
        setShowStickerDropOverlay(false);
        setStickerDragOver(false);
        stickerGlobalDragTimeoutRef.current = null;
      }, 500) as unknown as number;
    };

    const handleWindowDrop = () => {
      setShowStickerDropOverlay(false);
      setStickerDragOver(false);
      if (stickerGlobalDragTimeoutRef.current) {
        window.clearTimeout(stickerGlobalDragTimeoutRef.current);
        stickerGlobalDragTimeoutRef.current = null;
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragenter', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragenter', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`bookform-page ${state.closing ? 'exiting' : 'entering'}`}>
      <div
        className={`bookform-container ${state.closing ? 'exiting' : 'entering'}`}
        onAnimationEnd={onAnimationEnd}
      >
        <Row className="mb-3 align-items-center bookform-header-row">
          <Col xs="auto" className="pe-2">
            <Button
              color="transparent"
              onClick={handleClose}
              className="bookform-back-btn"
            >
              <div style={{ color: 'white' }}>← Back</div>
            </Button>
          </Col>
          <Col>
            <h3 className="mb-0 bookform-title-center">
              Book Review
              <span
                className={`bookform-save-status ${state.saveStatus === 'saving' ? 'saving' : state.saveStatus === 'saved' ? 'saved' : ''}`}
              >
                {state.saveStatus === 'saving'
                  ? ' Saving...'
                  : state.saveStatus === 'saved'
                    ? ' Saved'
                    : ''}
              </span>
            </h3>
          </Col>
        </Row>

        <div className="bookform-body">
          <Row>
            <Col md={8}>
              <Row>
                <Col md={12}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-5 me-3">Title: </label>
                    <ColoredInput
                      name="title"
                      value={state.title}
                      onChange={(v) => set({ title: v })}
                      color={state.inputColors?.title || 'rgb(0, 206, 209)'}
                      onColorChange={(c) => setInputColor('title', c)}
                      style={{ fontSize: "20px"}}
                    />
                  </div>
                </Col>

                <Col md={7}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-5 me-3">Autor: </label>
                    <ColoredInput
                      name="author"
                      showColorIcon={false}
                      value={state.author}
                      onChange={(v) => set({ author: v })}
                      color={state.inputColors?.title || 'rgb(0, 206, 209)'}
                      onColorChange={(c) => setInputColor('author', c)}
                    />
                  </div>
                </Col>
                  <Col md={5}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-5 me-3">Pages: </label>
                    <ColoredInput
                      name="pages"
                      type="number"
                      value={state.pages}
                      showColorIcon={false}
                      onChange={(v) => set({ pages: v })}
                      color={state.inputColors?.title || 'rgb(0, 206, 209)'}
                      onColorChange={(c) => setInputColor('pages', c)}
                    />
                  </div>
                </Col>
                
                <Col md={7}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-5 me-3">
                      Publish&nbsp;Date:{' '}
                    </label>
                    <ColoredInput
                      name="publishDate"
                      type="date"
                      value={state.publishDate}
                      showColorIcon={false}
                      onChange={(v) => set({ publishDate: v })}
                      color={state.inputColors?.title || 'rgb(0, 206, 209)'}
                      onColorChange={(c) => setInputColor('publishDate', c)}
                    />
                  </div>
                </Col>
              <Col md={5}>
                 <div className="mb-2 d-flex align-items-center me-5">
                    <label className="bookform-label fs-5"> End&nbsp;Date:</label>
                    <ColoredInput
                      name="endDate"
                      type="date"
                      value={state.endDate}
                      showColorIcon={false}
                      onChange={(v) => set({ endDate: v })}
                      color={state.inputColors?.title || 'rgb(0, 206, 209)'}
                      onColorChange={(c) => setInputColor('endDate', c)}
                      inputWidth={188}
                    />
                  </div>
                  
                </Col>
                <Col md={12}>
                 <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-5 me-3">Genre: </label>
                    <ColoredInput
                      name="genre"
                      value={state.genre}
                      showColorIcon={false}
                      onChange={(v) => set({ genre: v })}
                      color={state.inputColors?.title || 'rgb(0, 206, 209)'}
                      onColorChange={(c) => setInputColor('genre', c)}
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="mb-2 d-flex field-underline align-items-center">
                    <label className="bookform-label fs-5">Format: </label>
                    <div className="format-group d-flex align-self-center">
                      <div className="form-check d-flex align-items-center ">
                        <Input
                          type="radio"
                          name="format"
                          id="fmt-hardcover"
                          checked={state.format === 'hardcover'}
                          onChange={() => set({ format: 'hardcover' })}
                        />
                        <label
                          className="form-check-label ms-2 fmt-label mt-1 fs-5"
                          htmlFor="fmt-hardcover"
                        >
                          Hardcover
                        </label>
                      </div>
                      <div className="form-check d-flex align-items-center">
                        <Input
                          type="radio"
                          name="format"
                          id="fmt-paperback"
                          checked={state.format === 'paperback'}
                          onChange={() => set({ format: 'paperback' })}
                        />
                        <label
                          className="form-check-label ms-2 fmt-label mt-1 fs-5"
                          htmlFor="fmt-paperback"
                        >
                          Paperback
                        </label>
                      </div>
                      <div className="form-check d-flex align-items-center">
                        <Input
                          type="radio"
                          name="format"
                          id="fmt-ebook"
                          checked={state.format === 'ebook'}
                          onChange={() => set({ format: 'ebook' })}
                        />
                        <label
                          className="form-check-label ms-2 fmt-label mt-1 fs-5"
                          htmlFor="fmt-ebook"
                        >
                          E-book
                        </label>
                      </div>
                      <div className="form-check d-flex align-items-center">
                        <Input
                          type="radio"
                          name="format"
                          id="fmt-audio"
                          checked={state.format === 'audiobook'}
                          onChange={() => set({ format: 'audiobook' })}
                        />
                        <label
                          className="form-check-label ms-2 fmt-label mt-1 fs-5"
                          htmlFor="fmt-audio"
                        >
                          Audiobook
                        </label>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="bookform-label fs-5 me-3">Summary</label>
              </div>
              <div className="mb-2">
                <ColoredInput
                  name="summary"
                  textarea
                  value={state.summary}
                  defaultHeight={200}
                  savedHeight={state.summaryHeight}
                  onHeightChange={(h) => set({ summaryHeight: h })}
                  onChange={(v) => set({ summary: v })}
                  color={state.inputColors?.summary || state.summaryColor || 'rgb(220, 220, 170)'}
                  onColorChange={(c) => { setInputColor('summary', c); set({ summaryColor: c }); }}
                />
              </div>

              <div className="mb-2 d-flex align-items-center gap-3"></div>
            </Col>
            <Col md={4} className="mb-3">
              <div
                className={`bookform-cover-placeholder ${state.dragging ? 'dragging' : ''}`}
                onClick={onCoverClick}
                onDragOver={onDragOverCover}
                onDragLeave={onDragLeaveCover}
                onDrop={onDropCover}
                role="button"
              >
                {state.previewUrl ? (
                  <img
                    src={state.previewUrl}
                    alt="cover preview"
                    className="bookform-cover-img-preview"
                  />
                ) : state.cover ? (
                  <div className="bookform-cover-name">{state.cover.name}</div>
                ) : (
                  <div className="bookform-cover-empty">
                    Click or drop image here
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={onFileChange}
                />
              </div>
              <div className="d-flex flex-column align-items-center justify-content-center">
                <Stars
                  edit={false}
                  count={5}
                  half={true}
                  value={state.rating}
                  size={28}
                  color1="#cccccc"
                  color2="#ffd700"
                />
                <span className="bookform-rating-text">{state.rating}/5</span>
              </div>
            </Col>
          </Row>
          <label className="w-100 text-center bookform-label fs-5">
            What do you think about this book?
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
            <label className="bookform-label fs-6 me-3" style={{ marginRight: 8, display: 'none' }}>Book Review color</label>

          </div>
            <div className="mb-2 textarea-box">
              <ColoredInput
                name="bookReview"
                textarea
                defaultHeight={280}
                value={state.bookReview}
                savedHeight={state.bookReviewHeight}
                onHeightChange={(h) => set({ bookReviewHeight: h })}
                onChange={(v) => set({ bookReview: v })}
                color={state.inputColors?.bookReview || state.bookReviewColor || 'rgb(77, 201, 176)'}
                onColorChange={(c) => { setInputColor('bookReview', c); set({ bookReviewColor: c }); }}
              />
            </div>
          <Row className="mt-3">
            <Col md={6}>
              <label className="bookform-label fs-5 me-3">
                How did I feel when reading this book?
              </label>
              <div className="mb-2 d-flex field-underline"></div>
              <div style={{ height: 150 }}></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
              </div>
              <div className="mb-2 textarea-box">
                <ColoredInput
                  name="dataAdditional"
                  textarea
                  value={state.dataAdditional}
                  defaultHeight={280}
                  savedHeight={state.dataAdditionalHeight}
                  onHeightChange={(h) => set({ dataAdditionalHeight: h })}
                  onChange={(v) => set({ dataAdditional: v })}
                  color={state.inputColors?.dataAdditional || state.dataAdditionalColor || 'rgb(206, 136, 94)'}
                  onColorChange={(c) => { setInputColor('dataAdditional', c); set({ dataAdditionalColor: c }); }}
                />
              </div>
            </Col>
            <Col md={6}>
              <label className="bookform-label fs-5 me-3">Book Ratings</label>
              <div className="mb-2 d-flex field-underline"></div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100 p-0">
                  <Col sm={4}>
                    <label className="bookform-label fs-5">Content</label>
                  </Col>
                  <Col sm={6} className="d-flex align-items-center">
                    <div
                      className="ms-3"
                      style={{ width: '100%', maxWidth: '100%' }}
                    >
                      <Stars
                        edit={false}
                        count={5}
                        half={true}
                        value={state.content}
                        onChange={(value: number) =>
                          set({ content: Number(value) })
                        }
                        size={25}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={ratingInputValue('content', state.content)}
                      onFocus={handleRatingFocus('content')}
                      onChange={handleRatingChange('content')}
                      onBlur={handleRatingBlur('content')}
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100 pt-1">
                  <Col sm={4}>
                    <label className="bookform-label fs-5 no-wrap">
                      Writing&nbsp;Style
                    </label>
                  </Col>
                  <Col sm={6} className="d-flex align-items-center">
                    <div
                      className="ms-3"
                      style={{ width: '100%', maxWidth: '100%' }}
                    >
                      <Stars
                        edit={false}
                        count={5}
                        half={true}
                        value={state.writingStyle}
                        onChange={(value: number) =>
                          set({ writingStyle: Number(value) })
                        }
                        size={25}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={ratingInputValue('writingStyle', state.writingStyle)}
                      onFocus={handleRatingFocus('writingStyle')}
                      onChange={handleRatingChange('writingStyle')}
                      onBlur={handleRatingBlur('writingStyle')}
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100 pt-1">
                  <Col sm={4}>
                    <label className="bookform-label fs-5 no-wrap">
                      Readability
                    </label>
                  </Col>
                  <Col sm={6} className="d-flex align-items-center">
                    <div
                      className="ms-3"
                      style={{ width: '100%', maxWidth: '100%' }}
                    >
                      <Stars
                        edit={false}
                        count={5}
                        half={true}
                        value={state.readability}
                        onChange={(value: number) =>
                          set({ readability: Number(value) })
                        }
                        size={25}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={ratingInputValue('readability', state.readability)}
                      onFocus={handleRatingFocus('readability')}
                      onChange={handleRatingChange('readability')}
                      onBlur={handleRatingBlur('readability')}
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100 pt-1">
                  <Col sm={4}>
                    <label className="bookform-label fs-5 no-wrap">
                      Plot&nbsp;Development
                    </label>
                  </Col>
                  <Col sm={6} className="d-flex align-items-center">
                    <div
                      className="ms-3"
                      style={{ width: '100%', maxWidth: '100%' }}
                    >
                      <Stars
                        edit={false}
                        count={5}
                        half={true}
                        value={state.plotDevelopment}
                        onChange={(value: number) =>
                          set({ plotDevelopment: Number(value) })
                        }
                        size={25}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={ratingInputValue('plotDevelopment', state.plotDevelopment)}
                      onFocus={handleRatingFocus('plotDevelopment')}
                      onChange={handleRatingChange('plotDevelopment')}
                      onBlur={handleRatingBlur('plotDevelopment')}
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-noline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100 pt-1">
                  <Col sm={4}>
                    <label className="bookform-label fs-5 no-wrap">
                      Characters
                    </label>
                  </Col>
                  <Col
                    sm={6}
                    className="d-flex align-items-end justify-content-end "
                  >
                    <div
                      className="ms-3"
                      style={{ width: '100%', maxWidth: '100%' }}
                    >
                      <Stars
                        edit={false}
                        count={5}
                        half={true}
                        value={state.characters}
                        onChange={(value: number) =>
                          set({ characters: Number(value) })
                        }
                        size={25}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={ratingInputValue('characters', state.characters)}
                      onFocus={handleRatingFocus('characters')}
                      onChange={handleRatingChange('characters')}
                      onBlur={handleRatingBlur('characters')}
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>

            </Col>
          </Row>
        </div>
        {showStickerDropOverlay && (
          <div
            className={`sticker-drop-overlay ${stickerDragOver ? 'dragover' : ''}`}
          >
            <div
              className="sticker-drop-overlay-box"
              onDragOver={onDragOverStickerZone}
              onDragLeave={onDragLeaveStickerZone}
              onDrop={onDropStickerZone}
            >
              Drop sticker here
            </div>
          </div>
        )}
        {/* Floating stickers synced to this BookForm's state */}
        <FloatingStickers onChange={handleStickersChange} initialStickers={state.stickers} />
      </div>
    </div>
  );
}
