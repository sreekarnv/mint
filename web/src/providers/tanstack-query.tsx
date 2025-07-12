import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface TanstackQueryProviderProps {
	children: React.ReactNode;
}

const client = new QueryClient();

const TanstackQueryProvider: React.FC<TanstackQueryProviderProps> = ({
	children,
}) => {
	return (
		<>
			<QueryClientProvider client={client}>
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</>
	);
};

export default TanstackQueryProvider;
