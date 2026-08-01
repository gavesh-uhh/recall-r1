declare module 'electron-squirrel-startup';

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.png' {
  const src: string;
  export default src;
}

interface Window {
  electronAPI?: {
    apiRequest: (options: {
      url: string;
      method?: string;
      body?: string;
      headers?: Record<string, string>;
    }) => Promise<{
      ok: boolean;
      status: number;
      data?: any;
      error?: string;
    }>;
  };
}
