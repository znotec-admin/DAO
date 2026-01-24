import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { wagmiConfig } from '../../utils/wagmi';

const WalletProvider = ({ children }) => {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</WagmiProvider>
	);
};

export default WalletProvider;
