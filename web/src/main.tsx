import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TanstackQueryProvider from '@/providers/tanstack-query';
import RouterProvider from '@/providers/router';
import { Toaster } from '@/components/ui/sonner';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TanstackQueryProvider>
			<RouterProvider />
			<Toaster richColors />
		</TanstackQueryProvider>
	</StrictMode>
);
