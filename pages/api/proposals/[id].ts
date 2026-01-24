import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { hydrateProposalsFromChain, requireMethod, sendError } from '../../../utils/proposalApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'GET')) return;

	try {
		await connectMongo();
		const proposal = await Proposal.findOne({ _id: req.query.id });
		if (!proposal) {
			const error: HttpError = new Error('Proposal not found.');
			error.statusCode = 404;
			throw error;
		}
		const [proposalView] = await hydrateProposalsFromChain([proposal]);
		res.status(200).json({ result: 'success', proposal: proposalView || proposal });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to load proposal');
	}
}
