import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

import connectMongo from '../../db/connect';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
	let mongoOk = mongoose.connection.readyState === 1;

	if (!mongoOk) {
		try {
			await connectMongo();
			mongoOk = mongoose.connection.readyState === 1;
		} catch (_error) {
			mongoOk = false;
		}
	}

	res.status(200).json({
		status: 'ok',
		server: 'FolioDAO',
		mongo: mongoOk ? 'connected' : 'disconnected',
		timestamp: new Date().toISOString(),
	});
}
