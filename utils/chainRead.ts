import Web3 from 'web3';

import { HODLDAO_ADDRESS } from './_constants';
import { voteWeight } from './voteMath';
import CONTRACT_ABI from '../abi/ABI.json';

const ENV_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const READ_RPC_URLS = [
	...(ENV_RPC_URL ? [ENV_RPC_URL] : []),
	'https://polygon-bor-rpc.publicnode.com',
	'https://rpc.ankr.com/polygon',
	'https://polygon-rpc.com',
];

const toUnix = (value: unknown): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const getVoteContract = () => {
	const rpcUrl = READ_RPC_URLS[0];
	const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl, { timeout: 12000 }));
	return new web3.eth.Contract(CONTRACT_ABI as any, HODLDAO_ADDRESS);
};

export type OnChainProposal = {
	token_id: number | null;
	id: string;
	status: number;
	votes_yes: string;
	votes_no: string;
	start_at: number;
	end_at: number;
	receiver: string;
	amount: unknown;
	executed: boolean;
};

const normalizeProposal = (raw: any, proposalId?: number | string | null): OnChainProposal => ({
	token_id: proposalId == null ? null : Number(proposalId),
	id: raw?.id != null ? String(raw.id) : '',
	status: toUnix(raw?.status),
	votes_yes: voteWeight(raw?.votes_yes),
	votes_no: voteWeight(raw?.votes_no),
	start_at: toUnix(raw?.start_at),
	end_at: toUnix(raw?.end_at),
	receiver: raw?.receiver || '',
	amount: raw?.amount,
	executed: Boolean(raw?.executed),
});

export const ON_CHAIN_STATUS = {
	Pending: 0,
	Live: 1,
	Closed: 2,
	Executed: 3,
};

const chainError = (message: string, statusCode = 502): HttpError => {
	const error: HttpError = new Error(message);
	error.statusCode = statusCode;
	return error;
};

export const parseProposalId = (value: unknown): number => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw chainError('Invalid on-chain proposal id.', 400);
	}
	return parsed;
};

export const readOnChainProposal = async (proposalId: number | string): Promise<OnChainProposal> => {
	try {
		const voteContract = getVoteContract();
		const raw = await voteContract.methods.getProposal(proposalId).call();
		return normalizeProposal(raw, proposalId);
	} catch (error) {
		if ((error as HttpError).statusCode) throw error;
		throw chainError('Could not read this proposal from the chain.');
	}
};

export const readProposalOwner = async (proposalId: number | string): Promise<string> => {
	try {
		const voteContract = getVoteContract();
		return await voteContract.methods.ownerOf(proposalId).call();
	} catch (error) {
		if ((error as HttpError).statusCode) throw error;
		throw chainError('Could not read the on-chain proposal owner.');
	}
};

export const readApproved = async (proposalId: number | string): Promise<boolean> => {
	try {
		const voteContract = getVoteContract();
		return Boolean(await voteContract.methods.checkApproved(proposalId).call());
	} catch (error) {
		if ((error as HttpError).statusCode) throw error;
		throw chainError('Could not read the on-chain approval state.');
	}
};
