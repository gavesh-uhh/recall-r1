import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest: (options: {
    url: string;
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }) => ipcRenderer.invoke('api-request', options),
});
