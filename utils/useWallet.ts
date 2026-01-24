import { useMemo } from 'react';
import { useAccount, useConnectorClient } from 'wagmi';
import Web3 from 'web3';

export const useWallet = () => {
	const { address, isConnected, chainId, status } = useAccount();
	const { data: client } = useConnectorClient();

	const library = useMemo(() => {
		if (!client) return null;
		const connectorClient = client as { request: (payload: any) => Promise<any> };
		const provider = {
			request: (payload: any) => connectorClient.request(payload),
		};
		return new Web3(provider as any);
	}, [client]);

	return {
		account: address,
		library,
		chainId,
		isConnected,
		status,
	};
};
