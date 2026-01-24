import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { requireMethod, requireWalletAuth, sendError, sameAddress } from '../../../utils/proposalApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'POST')) return;

	try {
		await connectMongo();
		const mongoId = req.body?.id;
		const signer = await requireWalletAuth(req, 'delete', mongoId);

		const proposal = await Proposal.findOne({ _id: mongoId });
		if (!proposal) {
			const error: HttpError = new Error('Proposal not found.');
			error.statusCode = 404;
			throw error;
		}
		if (!sameAddress(signer, proposal.proposer)) {
			const error: HttpError = new Error('Only the proposer can delete this proposal.');
			error.statusCode = 403;
			throw error;
		}
		if (proposal.synced && !proposal.canceled) {
			const error: HttpError = new Error('Cancel the on-chain proposal before deleting its record.');
			error.statusCode = 409;
			throw error;
		}

		await proposal.deleteOne();
		res.status(200).json({ result: 'success' });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to delete proposal');
	}
}
