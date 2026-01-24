import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { readApproved, readOnChainProposal } from '../../../utils/chainRead';
import { requireMethod, requireWalletAuth, sendError } from '../../../utils/proposalApi';
import { voteWeight } from '../../../utils/voteMath';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'POST')) return;

	try {
		await connectMongo();
		const proposalId = req.body?.id;
		await requireWalletAuth(req, 'vote', proposalId);

		const proposal = await Proposal.findOne({ _id: proposalId });
		if (!proposal) {
			const error: HttpError = new Error('Proposal not found.');
			error.statusCode = 404;
			throw error;
		}
		if (proposal.token_id == null) {
			const error: HttpError = new Error('This proposal is not synced on-chain yet.');
			error.statusCode = 409;
			throw error;
		}

		const onChain = await readOnChainProposal(proposal.token_id);
		if (onChain.id && onChain.id !== String(proposal._id)) {
			const error: HttpError = new Error('On-chain proposal does not match this record.');
			error.statusCode = 409;
			throw error;
		}

		proposal.votes_yes = voteWeight(onChain.votes_yes);
		proposal.votes_no = voteWeight(onChain.votes_no);
		proposal.approved = await readApproved(proposal.token_id);
		const savedProposal = await proposal.save();
		res.status(200).json({ result: 'success', proposal: savedProposal });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to record vote');
	}
}
