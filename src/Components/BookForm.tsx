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

type Props = {
  onClose: () => void;
  initialData?: {
    id?: string;
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

  type State = {
    id: string | null;
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
    title: '',
    author: '',
    genre: '',
    publishDate: '',
    summary: '',
    summaryColor: '#ffffff',
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
    bookReviewColor: '#ffffff',
    dataAdditional: '',
    dataAdditionalColor: '#ffffff',
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

  
  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));
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

  const buildPayload = () => ({
    id: state.id,
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
                    <label className="bookform-label fs-6 me-3">Title: </label>
                    <ColoredInput
                      name="title"
                      value={state.title}
                      onChange={(v) => set({ title: v })}
                      color={state.inputColors?.title || '#ffffff'}
                      onColorChange={(c) => setInputColor('title', c)}
                    />
                  </div>
                </Col>

                <Col md={7}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-6 me-3">Autor: </label>
                    <ColoredInput
                      name="author"
                      value={state.author}
                      onChange={(v) => set({ author: v })}
                      color={state.inputColors?.author || '#ffffff'}
                      onColorChange={(c) => setInputColor('author', c)}
                    />
                  </div>
                </Col>
                <Col md={5}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-6 me-3">Genre: </label>
                    <ColoredInput
                      name="genre"
                      value={state.genre}
                      onChange={(v) => set({ genre: v })}
                      color={state.inputColors?.genre || '#ffffff'}
                      onColorChange={(c) => setInputColor('genre', c)}
                    />
                  </div>
                </Col>
                <Col md={7}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-6 me-3">
                      Publish&nbsp;Date:{' '}
                    </label>
                    <ColoredInput
                      name="publishDate"
                      type="date"
                      value={state.publishDate}
                      onChange={(v) => set({ publishDate: v })}
                      color={state.inputColors?.publishDate || '#ffffff'}
                      onColorChange={(c) => setInputColor('publishDate', c)}
                    />
                  </div>
                </Col>
                <Col md={5}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-6 me-3">Pages: </label>
                    <ColoredInput
                      name="pages"
                      type="number"
                      value={state.pages}
                      onChange={(v) => set({ pages: v })}
                      color={state.inputColors?.pages || '#ffffff'}
                      onColorChange={(c) => setInputColor('pages', c)}
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="mb-2 d-flex align-items-center">
                    <label className="bookform-label fs-6 me-3">
                      End&nbsp;Date:{' '}
                    </label>
                    <ColoredInput
                      name="endDate"
                      type="date"
                      value={state.endDate}
                      onChange={(v) => set({ endDate: v })}
                      color={state.inputColors?.endDate || '#ffffff'}
                      onColorChange={(c) => setInputColor('endDate', c)}
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="mb-2 d-flex field-underline align-items-center">
                    <label className="bookform-label fs-6 ">Format: </label>
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
                          className="form-check-label ms-2 fmt-label mt-1"
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
                          className="form-check-label ms-2 fmt-label mt-1"
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
                          className="form-check-label ms-2 fmt-label mt-1"
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
                          className="form-check-label ms-2 fmt-label mt-1"
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
                <label className="bookform-label fs-6 me-3">Summary</label>
              </div>
              <div className="mb-2">
                <ColoredInput
                  name="summary"
                  textarea
                  value={state.summary}
                  defaultHeight={300}
                  savedHeight={state.summaryHeight}
                  onHeightChange={(h) => set({ summaryHeight: h })}
                  onChange={(v) => set({ summary: v })}
                  color={state.inputColors?.summary || state.summaryColor || '#ffffff'}
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
            Book Review
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
            <label className="bookform-label fs-6 me-3" style={{ marginRight: 8, display: 'none' }}>Book Review color</label>

          </div>
            <div className="mb-2 textarea-box">
              <ColoredInput
                name="bookReview"
                textarea
                value={state.bookReview}
                savedHeight={state.bookReviewHeight}
                onHeightChange={(h) => set({ bookReviewHeight: h })}
                onChange={(v) => set({ bookReview: v })}
                color={state.inputColors?.bookReview || state.bookReviewColor || '#ffffff'}
                onColorChange={(c) => { setInputColor('bookReview', c); set({ bookReviewColor: c }); }}
              />
            </div>
          <Row className="mt-3">
            <Col md={6}>
              <label className="bookform-label fs-6 me-3">
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
                  defaultHeight={400}
                  savedHeight={state.dataAdditionalHeight}
                  onHeightChange={(h) => set({ dataAdditionalHeight: h })}
                  onChange={(v) => set({ dataAdditional: v })}
                  color={state.inputColors?.dataAdditional || state.dataAdditionalColor || '#ffffff'}
                  onColorChange={(c) => { setInputColor('dataAdditional', c); set({ dataAdditionalColor: c }); }}
                />
              </div>
            </Col>
            <Col md={6}>
              <label className="bookform-label fs-6 me-3">Book Ratings</label>
              <div className="mb-2 d-flex field-underline"></div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100 p-0">
                  <Col sm={4}>
                    <label className="bookform-label fs-6">Content</label>
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
                        size={20}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={state.content}
                      onChange={(e: any) =>
                        set({ content: e.target.value })
                      }
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100">
                  <Col sm={4}>
                    <label className="bookform-label fs-6 no-wrap">
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
                        size={20}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={state.writingStyle}
                      onChange={(e: any) =>
                        set({ writingStyle: e.target.value })
                      }
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100">
                  <Col sm={4}>
                    <label className="bookform-label fs-6 no-wrap">
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
                        size={20}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={state.readability}
                      onChange={(e: any) =>
                        set({ readability: e.target.value })
                      }
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-underline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100">
                  <Col sm={4}>
                    <label className="bookform-label fs-6 no-wrap">
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
                        size={20}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={state.plotDevelopment}
                      onChange={(e: any) =>
                        set({ plotDevelopment: e.target.value })
                      }
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>
              <div className="field-noline d-flex flex-column align-items-center">
                <Row className="align-items-center w-100">
                  <Col sm={4}>
                    <label className="bookform-label fs-6 no-wrap">
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
                        size={20}
                        gap={12}
                        color1="#cccccc"
                        color2="#ffd700"
                      />
                    </div>
                  </Col>
                  <Col sm={2} className="d-flex">
                    <Input
                      type="number"
                      value={state.characters}
                      onChange={(e: any) =>
                        set({ characters: e.target.value })
                      }
                      className="rating-input input-line"
                    />
                  </Col>
                </Row>
              </div>

              <div className="mb-2 textarea-box" style={{ height: 350 }}>
                
              </div>
            </Col>
          </Row>
        </div>
        {/* Floating stickers synced to this BookForm's state */}
        <FloatingStickers onChange={handleStickersChange} initialStickers={state.stickers} />
      </div>
    </div>
  );
}
