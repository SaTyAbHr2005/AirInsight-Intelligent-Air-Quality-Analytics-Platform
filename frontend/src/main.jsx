import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.jsx';
import './index.css';
import { AppProvider } from './context/AppContext.jsx';

const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AppProvider>
                <App />
                <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', fontFamily: 'var(--font-sans)' } }} />
            </AppProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
