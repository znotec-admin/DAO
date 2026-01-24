import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { cleanProposalDescription, requireMethod, requireWalletAuth, sendError, sameAddress } from '../../../utils/proposalApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'POST')) return;

	try {
		await connectMongo();
		const signer = await requireWalletAuth(req, 'create');

		const proposalParams = req.body || {};
		if (!sameAddress(signer, proposalParams.proposer)) {
			const error: HttpError = new Error('Proposer must match the signed wallet.');
			error.statusCode = 403;
			throw error;
		}

		const proposal = new Proposal();
		proposal.title = String(proposalParams.title || '').slice(0, 200);
		proposal.description = cleanProposalDescription(proposalParams.description);
		proposal.attachment = proposalParams.attachment || '';
		proposal.proposer = signer;
		proposal.receiver = proposalParams.receiver;
		proposal.amount = Number(proposalParams.amount) || 0;
		proposal.start_at = Math.floor(Date.now() / 1000);
		proposal.votes_yes = '0';
		proposal.votes_no = '0';

		switch (String(proposalParams.period)) {
			case '10':
				proposal.end_at = proposal.start_at + 600;
				break;
			case '48':
				proposal.end_at = proposal.start_at + 48 * 3600;
				break;
			case '72':
				proposal.end_at = proposal.start_at + 72 * 3600;
				break;
			default:
				proposal.end_at = proposal.start_at + 24 * 3600;
		}

		const newProposal = await proposal.save();
		res.status(200).json({ result: 'success', proposal: newProposal });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to create proposal');
	}
}
