import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchMarketPriceById, fetchMarketPriceBySymbol } from '../../../utils/prices';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ result: 'error', message: 'Method not allowed' });
	}

	const { id } = req.query;

	if (!id) {
		return res.status(400).json({ result: 'error', message: 'Coin id is required' });
	}

	try {
		const coinId = String(id);
		let coin = await fetchMarketPriceById(coinId);

		if (!coin) {
			coin = await fetchMarketPriceBySymbol(coinId);
		}

		if (!coin) {
			return res.status(404).json({
				result: 'error',
				message: `Price not found for "${coinId}"`,
			});
		}

		return res.status(200).json({
			result: 'success',
			currency: 'usd',
			timestamp: new Date().toISOString(),
			data: coin,
		});
	} catch (error) {
		console.error('prices/[id] error:', (error as Error).message);
		return res.status(500).json({
			result: 'error',
			message: 'Failed to fetch coin price',
		});
	}
}
