import AuthNonce from '../db/models/authNonce';

const NONCE_PATTERN = /^[a-fA-F0-9]{16,64}$/;

export const consumeAuthNonce = async ({
	nonce,
	address,
	action,
}: {
	nonce?: string;
	address?: string;
	action?: string;
}): Promise<void> => {
	if (!NONCE_PATTERN.test(String(nonce || ''))) {
		const error: HttpError = new Error('Invalid signature nonce.');
		error.statusCode = 401;
		throw error;
	}

	try {
		await AuthNonce.create({
			_id: String(nonce),
			address: String(address || '').toLowerCase(),
			action: action || '',
		});
	} catch (error) {
		if (error && (error as { code?: number }).code === 11000) {
			const replay: HttpError = new Error('This signed request was already used.');
			replay.statusCode = 401;
			throw replay;
		}
		throw error;
	}
};
