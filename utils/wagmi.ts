import { http, createConfig } from 'wagmi';
import { polygon } from 'viem/chains';
import { coinbaseWallet, injected, walletConnect } from './wagmiConnectors';

import { NETWORK_CHAIN_ID } from './_constants';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-bor-rpc.publicnode.com';
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const connectors: any[] = [
	injected({ shimDisconnect: true }),
	coinbaseWallet({
		appName: 'FolioDAO',
		preference: 'eoaOnly',
	}),
];

if (WALLETCONNECT_PROJECT_ID) {
	connectors.push(walletConnect({
		projectId: WALLETCONNECT_PROJECT_ID,
		showQrModal: true,
		metadata: {
			name: 'FolioDAO',
			description: 'FolioDAO governance',
			url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
			icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assets/images/fav-icon/icon.png`],
		},
	}));
}

export const wagmiConfig = createConfig({
	chains: [polygon],
	connectors,
	transports: {
		[polygon.id]: http(RPC_URL),
	},
	ssr: true,
});

export const TARGET_CHAIN_ID = NETWORK_CHAIN_ID || polygon.id;
