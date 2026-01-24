import type Web3 from 'web3';

import { buildAuthMessage } from './auth';

const randomNonce = (): string => {
	const bytes = new Uint8Array(16);
	globalThis.crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const signAuthPayload = async (
	library: Web3 | null | undefined,
	account: string | undefined,
	action: string,
	extra = '',
) => {
	if (!library || !account) {
		throw new Error('Connect your wallet to continue.');
	}

	const timestamp = Date.now();
	const nonce = randomNonce();
	const message = buildAuthMessage({ action, address: account, timestamp, extra, nonce });
	const signature = await library.eth.personal.sign(message, account, '');
	return {
		address: account,
		signature,
		timestamp,
		action,
		extra,
		nonce,
	};
};
