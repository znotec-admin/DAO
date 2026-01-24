export type ProposalTab = 'live' | 'pending' | 'past';

export type ProposalView = {
	_id: string;
	title?: string;
	description?: string;
	attachment?: string;
	start_at?: number;
	end_at?: number;
	proposer?: string;
	receiver?: string;
	amount?: number | string;
	synced?: boolean;
	canceled?: boolean;
	token_id?: number | null;
	votes_yes?: string | number;
	votes_no?: string | number;
	approved?: boolean;
};
