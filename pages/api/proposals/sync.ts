import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { parseProposalId, readOnChainProposal, readProposalOwner } from '../../../utils/chainRead';
import { requireMethod, requireWalletAuth, sendError, sameAddress } from '../../../utils/proposalApi';
import { voteWeight } from '../../../utils/voteMath';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'POST')) return;

	try {
		await connectMongo();
		const mongoId = req.body?.id;
		const signer = await requireWalletAuth(req, 'sync', mongoId);

		const proposal = await Proposal.findOne({ _id: mongoId });
		if (!proposal) {
			const error: HttpError = new Error('Proposal not found.');
			error.statusCode = 404;
			throw error;
		}
		if (!sameAddress(signer, proposal.proposer)) {
			const error: HttpError = new Error('Only the proposer can sync this proposal.');
			error.statusCode = 403;
			throw error;
		}

		const tokenId = parseProposalId(req.body?.proposalId);
		if (proposal.synced && Number(proposal.token_id) !== tokenId) {
			const error: HttpError = new Error('This proposal is already synced to a different on-chain id.');
			error.statusCode = 409;
			throw error;
		}

		const onChain = await readOnChainProposal(tokenId);
		if (onChain.id !== String(proposal._id)) {
			const error: HttpError = new Error('On-chain proposal id does not match this record.');
			error.statusCode = 409;
			throw error;
		}

		const owner = await readProposalOwner(tokenId);
		if (!sameAddress(owner, signer)) {
			const error: HttpError = new Error('On-chain proposal owner does not match the signed wallet.');
			error.statusCode = 403;
			throw error;
		}

		proposal.synced = true;
		proposal.token_id = tokenId;
		proposal.votes_yes = voteWeight(onChain.votes_yes);
		proposal.votes_no = voteWeight(onChain.votes_no);
		const savedProposal = await proposal.save();
		res.status(200).json({ result: 'success', proposal: savedProposal });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to sync proposal');
	}
}
