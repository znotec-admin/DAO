import axios from 'axios';
import { API_BASE_URL } from './_constants';

axios.defaults.baseURL = API_BASE_URL;

const createError = (e) => {
	const message = e?.response?.data?.message || e?.message || 'Request failed';
	throw new Error(message);
};

export const getLiveProposals = async () => {
	try {
		return await axios.get('proposals/live');
	} catch (e) {
		createError(e);
	}
};

export const getPendingProposals = async () => {
	try {
		return await axios.get('proposals/pending');
	} catch (e) {
		createError(e);
	}
};

export const getPastProposals = async () => {
	try {
		return await axios.get('proposals/past');
	} catch (e) {
		createError(e);
	}
};

export const getProposal = async (_id) => {
	try {
		return await axios.get('proposals/' + _id);
	} catch (e) {
		createError(e);
	}
};

export const createProposal = async (data) => {
	try {
		return await axios.post('proposals/create', data);
	} catch (e) {
		createError(e);
	}
};

export const attachFileProposal = async (data, auth = {}) => {
	try {
		const formData = new FormData();
		formData.append('file', data.file[0]);
		Object.entries(auth).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				formData.append(key, String(value));
			}
		});

		return await axios.post('proposals/attachfile', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
	} catch (e) {
		createError(e);
	}
};

export const syncProposal = async (data) => {
	try {
		return await axios.post('proposals/sync', data);
	} catch (e) {
		createError(e);
	}
};

export const recordVote = async (data) => {
	try {
		return await axios.post('proposals/vote', data);
	} catch (e) {
		createError(e);
	}
};

export const cancelProposal = async (_id, auth = {}) => {
	try {
		return await axios.post('proposals/cancel', { id: _id, ...auth });
	} catch (e) {
		createError(e);
	}
};

export const deleteProposal = async (_id, auth = {}) => {
	try {
		return await axios.post('proposals/delete', { id: _id, ...auth });
	} catch (e) {
		createError(e);
	}
};

export const getCoinPrices = async (params = {}) => {
	try {
		return await axios.get('prices', { params });
	} catch (e) {
		createError(e);
	}
};

export const getCoinPrice = async (id) => {
	try {
		return await axios.get(`prices/${id}`);
	} catch (e) {
		createError(e);
	}
};

export const getProjectTokenPrices = async () => {
	try {
		return await axios.get('prices/tokens');
	} catch (e) {
		createError(e);
	}
};
