import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import Proposal from '../../../db/models/proposal';
import { hydrateProposalsFromChain, parsePageOptions, requireMethod, sendError } from '../../../utils/proposalApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'GET')) return;

	try {
		await connectMongo();
		const pageOptions = parsePageOptions(req.query as Record<string, unknown>);
		const now = Math.floor(Date.now() / 1000);
		const search = pageOptions.search;

		const match: Record<string, unknown> = {
			synced: true,
			canceled: false,
			end_at: { $lt: now },
		};
		if (search) {
			match.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } },
			];
		}

		const aggregate = Proposal.aggregate([
			{ $match: match },
			{ $sort: { createdAt: -1 } },
		]);

		const results = await (Proposal as any).aggregatePaginate(aggregate, pageOptions);
		results.docs = await hydrateProposalsFromChain(results.docs);
		res.status(200).json({ result: 'success', data: results });
	} catch (error) {
		console.log(error);
		sendError(res, error, 'Failed to load past proposals');
	}
}
