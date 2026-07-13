import { app, BrowserWindow, net, protocol } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Serve the built app over app:// instead of file:// so that fetch() works in
// the renderer — required for the crowd audio and the glTF athlete models.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const createWindow = () => {
  const win = new BrowserWindow({ width: 1440, height: 900, minWidth: 1100, minHeight: 720, backgroundColor: '#06101c', webPreferences: { contextIsolation: true, sandbox: true } });
  win.setMenuBarVisibility(false);
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadURL('app://bundle/index.html');
};

app.whenReady().then(() => {
  const distDir = path.join(__dirname, '../dist');
  protocol.handle('app', request => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname === '') pathname = '/index.html';
    const target = path.normalize(path.join(distDir, pathname));
    if (!target.startsWith(distDir)) return new Response('forbidden', { status: 403 });
    return net.fetch(pathToFileURL(target).toString());
  });
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length || createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
