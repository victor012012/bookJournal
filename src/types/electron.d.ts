export {};

declare global {
  interface Window {
    api: {
      saveJSON: (data: any) => Promise<boolean>;
      loadJSON: () => Promise<any>;
    };
  }
}

declare module "react-rating-stars-component";