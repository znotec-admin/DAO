import BigNumber from 'bignumber.js';

const ZERO = new BigNumber(0);

export const voteWeight = (value: unknown): string => {
	try {
		const parsed = new BigNumber(value == null || value === '' ? 0 : String(value));
		if (!parsed.isFinite() || parsed.isNegative()) return '0';
		return parsed.integerValue(BigNumber.ROUND_DOWN).toFixed(0);
	} catch (_error) {
		return '0';
	}
};

export const votePercents = (yes: unknown, no: unknown): { yes: number; no: number } => {
	const yesWeight = new BigNumber(voteWeight(yes));
	const noWeight = new BigNumber(voteWeight(no));
	const total = yesWeight.plus(noWeight);
	if (total.lte(ZERO)) {
		return { yes: 0, no: 0 };
	}

	const yesPercent = yesWeight.dividedBy(total).times(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
	return {
		yes: yesPercent,
		no: 100 - yesPercent,
	};
};
