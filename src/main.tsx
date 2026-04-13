import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp, ptBR } from '@/ds';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { solidesDocTheme } from '@/theme/solidesDocTheme';
import './index.css';

dayjs.locale('pt-br');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ptBR}
        theme={solidesDocTheme}
      >
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
