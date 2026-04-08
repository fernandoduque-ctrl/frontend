import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { networkInterfaces } from 'os';

function listLanIpv4(): string[] {
  const nets = networkInterfaces();
  const out: string[] = [];
  for (const list of Object.values(nets)) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        out.push(ni.address);
      }
    }
  }
  return [...new Set(out)];
}

function logServerBind(): Plugin {
  return {
    name: 'log-server-bind',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address();
        if (!addr || typeof addr !== 'object') return;
        const port = addr.port;
        console.log('');
        console.log(`[Vite] Porta: ${port}`);
        console.log(`[Vite] Local:  http://127.0.0.1:${port}/  |  http://localhost:${port}/`);
        const lan = listLanIpv4();
        if (lan.length > 0) {
          console.log('[Vite] Rede (mesma LAN):');
          for (const ip of lan) {
            console.log(`[Vite]          http://${ip}:${port}/`);
          }
        }
        console.log('');
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), logServerBind()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api-backend': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api-backend/, ''),
      },
    },
  },
});
