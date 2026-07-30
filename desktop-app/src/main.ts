import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Native Node.js IPC HTTP handler
ipcMain.handle(
  'api-request',
  async (
    _event,
    options: {
      url: string;
      method?: string;
      body?: string;
      headers?: Record<string, string>;
    }
  ) => {
    try {
      // Direct Node.js fetch execution (bypasses browser CORS & DNS IPv6 traps)
      const res = await fetch(options.url, {
        method: options.method || 'GET',
        headers: options.headers || { 'Content-Type': 'application/json' },
        body: options.body,
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      return {
        ok: res.ok,
        status: res.status,
        data,
      };
    } catch (err: any) {
      console.error('IPC api-request failed for:', options.url, err);
      return {
        ok: false,
        status: 500,
        error: err?.message || 'Network request failed',
      };
    }
  }
);

const createWindow = (): void => {
  // Create the browser window with dark theme styling.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    title: 'Recall — Error Memory Hub',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    show: false, // Show when ready to avoid visual flicker
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
