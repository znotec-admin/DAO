import { NETWORK_CHAIN_NAME } from './_constants';

export const sameAddress = (left?: string | null, right?: string | null): boolean => (
	Boolean(left) && Boolean(right) && String(left).toLowerCase() === String(right).toLowerCase()
);

export const listIncludesAddress = (list: unknown, account?: string | null): boolean => (
	Array.isArray(list) && list.some((addr) => sameAddress(String(addr), account))
);

export const getWalletErrorMessage = (err: unknown): string | false => {
	const raw = err as { shortMessage?: string; message?: string } | string | undefined;
	const message = String(
		(typeof raw === 'object' && raw ? raw.shortMessage || raw.message : raw) || '',
	);
	const lower = message.toLowerCase();

	if (!message) {
		return false;
	}
	if (lower.includes('user rejected') || lower.includes('denied') || lower.includes('rejected the request')) {
		return 'Please authorize this website to access your Ethereum account.';
	}
	if (lower.includes('already pending')) {
		return 'Wallet request already pending. Open your wallet and approve or reject the pending request.';
	}
	if (lower.includes('unsupported chain') || lower.includes('chain mismatch') || lower.includes('switchethereumchain')) {
		return `Wrong network selected. Please switch your wallet to ${NETWORK_CHAIN_NAME}.`;
	}
	if (lower.includes('provider') && (lower.includes('not found') || lower.includes('missing'))) {
		return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
	}
	return 'Wallet connection failed. Check the console for more details.';
};
