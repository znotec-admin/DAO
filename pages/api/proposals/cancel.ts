import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { ON_CHAIN_STATUS, readOnChainProposal } from '../../../utils/chainRead';
import { requireMethod, requireWalletAuth, sendError, sameAddress } from '../../../utils/proposalApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'POST')) return;

	try {
		await connectMongo();
		const mongoId = req.body?.id;
		const signer = await requireWalletAuth(req, 'cancel', mongoId);

		const proposal = await Proposal.findOne({ _id: mongoId });
		if (!proposal) {
			const error: HttpError = new Error('Proposal not found.');
			error.statusCode = 404;
			throw error;
		}
		if (!sameAddress(signer, proposal.proposer)) {
			const error: HttpError = new Error('Only the proposer can cancel this proposal.');
			error.statusCode = 403;
			throw error;
		}

		if (proposal.token_id != null) {
			const onChain = await readOnChainProposal(proposal.token_id);
			if (onChain.id && onChain.id !== String(proposal._id)) {
				const error: HttpError = new Error('On-chain proposal does not match this record.');
				error.statusCode = 409;
				throw error;
			}
			if (onChain.status === ON_CHAIN_STATUS.Live || onChain.status === ON_CHAIN_STATUS.Pending) {
				const error: HttpError = new Error('Close this proposal on-chain before canceling.');
				error.statusCode = 409;
				throw error;
			}
		}

		proposal.canceled = true;
		const savedProposal = await proposal.save();
		res.status(200).json({ result: 'success', proposal: savedProposal });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to cancel proposal');
	}
}
