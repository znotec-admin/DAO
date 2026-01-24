import type { NextApiRequest, NextApiResponse } from 'next';

import { readAuthFromRequest, verifyWalletSignature } from './auth';
import { consumeAuthNonce } from './consumeAuthNonce';
import { readApproved, readOnChainProposal } from './chainRead';
import { sanitizeHtml } from './sanitize';
import { voteWeight } from './voteMath';
import Proposal from '../db/models/proposal';

export const sendError = (res: NextApiResponse, error: unknown, fallback = 'Request failed') => {
	const err = error as HttpError;
	const status = err.statusCode || 500;
	const message = err.message || fallback;
	if (!res.headersSent) {
		res.status(status).json({ result: 'error', message });
	}
};

export const requireMethod = (
	req: NextApiRequest,
	res: NextApiResponse,
	methods: string | string[],
): boolean => {
	const allowed = Array.isArray(methods) ? methods : [methods];
	if (!allowed.includes(req.method || '')) {
		res.status(405).json({ result: 'error', message: 'Method not allowed' });
		return false;
	}
	return true;
};

export const requireWalletAuth = async (
	req: NextApiRequest,
	action: string,
	expectedExtra?: string,
): Promise<string> => {
	const auth = readAuthFromRequest(req);
	const signer = verifyWalletSignature({ ...auth, action: auth.action || action });
	if (expectedExtra !== undefined && String(auth.extra || '') !== String(expectedExtra)) {
		const error: HttpError = new Error('Signature does not match this request.');
		error.statusCode = 401;
		throw error;
	}
	await consumeAuthNonce({
		nonce: auth.nonce,
		address: signer,
		action: auth.action || action,
	});
	return signer;
};

const toPlainProposal = (doc: any) => {
	if (!doc) return doc;
	if (typeof doc.toObject === 'function') return doc.toObject();
	return { ...doc };
};

export const hydrateProposalsFromChain = async (docs: any[] = []) => {
	const items = Array.isArray(docs) ? docs : [];
	const updates: any[] = [];

	const hydrated = await Promise.all(items.map(async (doc) => {
		const plain = toPlainProposal(doc);
		if (plain.token_id == null) return plain;
		try {
			const onChain = await readOnChainProposal(plain.token_id);
			if (onChain.id && onChain.id !== String(plain._id)) return plain;
			const approved = await readApproved(plain.token_id);
			const next = {
				...plain,
				votes_yes: voteWeight(onChain.votes_yes),
				votes_no: voteWeight(onChain.votes_no),
				approved,
			};
			if (
				String(next.votes_yes) !== voteWeight(plain.votes_yes) ||
				String(next.votes_no) !== voteWeight(plain.votes_no) ||
				Boolean(next.approved) !== Boolean(plain.approved)
			) {
				updates.push({
					updateOne: {
						filter: { _id: plain._id },
						update: {
							$set: {
								votes_yes: next.votes_yes,
								votes_no: next.votes_no,
								approved: next.approved,
							},
						},
					},
				});
			}
			return next;
		} catch (_error) {
			return {
				...plain,
				votes_yes: voteWeight(plain.votes_yes),
				votes_no: voteWeight(plain.votes_no),
			};
		}
	}));

	if (updates.length) {
		try {
			await Proposal.bulkWrite(updates, { ordered: false });
		} catch (_error) {
			// Keep the hydrated response even if persistence fails.
		}
	}

	return hydrated;
};

export const parsePageOptions = (query: Record<string, unknown> = {}) => {
	const page = Math.max(1, parseInt(String(query.page || ''), 10) || 1);
	const limit = Math.min(50, Math.max(1, parseInt(String(query.limit || ''), 10) || 10));
	const search = String(query.search || '').slice(0, 100);
	return { page, limit, search };
};

export const sameAddress = (left?: string | null, right?: string | null): boolean => (
	Boolean(left) && Boolean(right) && String(left).toLowerCase() === String(right).toLowerCase()
);

export const cleanProposalDescription = (html?: string | null): string => sanitizeHtml(html);
