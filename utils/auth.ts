import Web3 from 'web3';

const AUTH_TTL_MS = 5 * 60 * 1000;
const NONCE_PATTERN = /^[a-fA-F0-9]{16,64}$/;

export type AuthPayload = {
	action: string;
	address: string;
	timestamp: number | string;
	extra?: string;
	nonce?: string;
	signature?: string;
};

const statusError = (message: string, statusCode: number): HttpError => {
	const error: HttpError = new Error(message);
	error.statusCode = statusCode;
	return error;
};

export const buildAuthMessage = ({
	action,
	address,
	timestamp,
	extra = '',
	nonce = '',
}: AuthPayload): string => {
	return [
		'FOLIODAO',
		`action:${action}`,
		`address:${String(address).toLowerCase()}`,
		`timestamp:${timestamp}`,
		extra ? `extra:${extra}` : '',
		`nonce:${nonce}`,
	].filter(Boolean).join('\n');
};

export const verifyWalletSignature = ({
	address,
	signature,
	timestamp,
	action,
	extra = '',
	nonce = '',
}: AuthPayload): string => {
	if (!address || !signature || !timestamp || !action || !nonce) {
		throw statusError('Wallet signature is required.', 401);
	}

	if (!NONCE_PATTERN.test(String(nonce))) {
		throw statusError('Invalid signature nonce.', 401);
	}

	const ts = Number(timestamp);
	if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > AUTH_TTL_MS) {
		throw statusError('Signature expired. Please retry the request.', 401);
	}

	const web3 = new Web3();
	if (!web3.utils.isAddress(address)) {
		throw statusError('Invalid wallet address.', 400);
	}

	const message = buildAuthMessage({ action, address, timestamp: ts, extra, nonce });
	let recovered: string;
	try {
		recovered = web3.eth.accounts.recover(message, signature);
	} catch (_error) {
		throw statusError('Invalid wallet signature.', 401);
	}

	if (String(recovered).toLowerCase() !== String(address).toLowerCase()) {
		throw statusError('Signature does not match the connected wallet.', 401);
	}

	return recovered;
};

export const readAuthFromRequest = (req: { body?: Record<string, unknown> }): AuthPayload => {
	const source = req.body || {};
	return {
		address: String(source.address || source.proposer || ''),
		signature: source.signature ? String(source.signature) : '',
		timestamp: source.timestamp as number | string,
		action: source.action ? String(source.action) : '',
		extra: source.extra ? String(source.extra) : '',
		nonce: source.nonce ? String(source.nonce) : '',
	};
};
