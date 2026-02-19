/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import fs from "fs";
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';


const filePath = path.join(app.getPath("documents"),"BookJournalData.json");

// Helper to load all books
function loadAllBooks(): any[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Helper to save all books
function saveAllBooks(books: any[]): void {
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2), "utf-8");
}

// Save a single book (upsert by id)
ipcMain.handle("save-json", async (_, data: any) => {
  const books = loadAllBooks();
  if (!data.id) {
    // New book - assign ID
    data.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    books.push(data);
  } else {
    // Update existing book
    const idx = books.findIndex((b: any) => b.id === data.id);
    if (idx >= 0) {
      books[idx] = data;
    } else {
      books.push(data);
    }
  }
  saveAllBooks(books);
  return data.id;
});

// Load all books
ipcMain.handle("load-json", async () => {
  return loadAllBooks();
});

// Delete a book by ID
ipcMain.handle("delete-book", async (_, id: string) => {
  const books = loadAllBooks();
  const filtered = books.filter((b: any) => b.id !== id);
  saveAllBooks(filtered);
  return true;
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch();
};



const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const LOCKED_ZOOM = 0.7;
  const enforceLockedZoom = (win: BrowserWindow | null, alwaysLog = false) => {
    if (!win) return;
    const cur = win.webContents.zoomFactor || 1;
    win.webContents.zoomFactor = LOCKED_ZOOM;
  };

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1090,
    minWidth: 1090,
    height: 1160,
    autoHideMenuBar: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  // Set zoom as early as possible to avoid a visible "jump".
  mainWindow.webContents.zoomFactor = LOCKED_ZOOM;

  // Block any user-driven zoom attempts (wheel / keyboard). Always enforce 0.7.
  mainWindow.webContents.on('before-input-event', (event, input: any) => {
    const isZoomWheel = input.control && input.type === 'mouseWheel';
    const isZoomShortcut =
      (input.control || input.meta) &&
      input.type === 'keyDown' &&
      (['+', '-', '=', '0'].includes(input.key) ||
        ['Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0'].includes(
          input.code,
        ));

    if (isZoomWheel || isZoomShortcut) {
      event.preventDefault();
      enforceLockedZoom(mainWindow);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    enforceLockedZoom(mainWindow);
  });

  // IPC handlers for renderer-driven zoom control
  ipcMain.handle('zoom-change', (_, delta: number) => {
    const bw = BrowserWindow.getFocusedWindow();
    if (!bw) return false;
    enforceLockedZoom(bw, true);
    return true;
  });

  ipcMain.handle('zoom-set', (_, factor: number) => {
    const bw = BrowserWindow.getFocusedWindow();
    if (!bw) return false;
    enforceLockedZoom(bw, true);
    return true;
  });

  ipcMain.handle('zoom-in', () => {
    const bw = BrowserWindow.getFocusedWindow();
    if (!bw) return false;
    enforceLockedZoom(bw, true);
    return true;
  });

  ipcMain.handle('zoom-out', () => {
    const bw = BrowserWindow.getFocusedWindow();
    if (!bw) return false;
    enforceLockedZoom(bw, true);
    return true;
  });

  ipcMain.handle('zoom-reset', () => {
    const bw = BrowserWindow.getFocusedWindow();
    if (!bw) return false;
    enforceLockedZoom(bw, true);
    return true;
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    // Keep the top menu bar hidden (Windows/Linux). MacOS always has a system menu.
    mainWindow.setMenuBarVisibility(false);

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch();
