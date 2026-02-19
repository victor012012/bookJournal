export {};

declare global {
  interface Window {
    api: {
      saveJSON: (data: any) => Promise<string>; // returns book id
      loadJSON: () => Promise<any[]>;
      deleteBook: (id: string) => Promise<boolean>;
      zoomChange: (delta: number) => Promise<boolean>;
      zoomSet: (factor: number) => Promise<boolean>;
      zoomIn: () => Promise<boolean>;
      zoomOut: () => Promise<boolean>;
      zoomReset: () => Promise<boolean>;
    };
  }
}

declare module "react-rating-stars-component";