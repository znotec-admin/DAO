import React, { useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import Modal from 'react-modal';

import { getWalletErrorMessage } from '../../utils/helpers';
import { NETWORK_CHAIN_ID } from '../../utils/_constants';

Modal.setAppElement('body');

const WALLETCONNECT_READY = Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

const classifyWallet = (connector) => {
	const id = String(connector.id || '').toLowerCase();
	const name = String(connector.name || '').toLowerCase();
	const rdns = String(connector.rdns || '').toLowerCase();
	const hay = `${id} ${name} ${rdns}`;

	if (hay.includes('walletconnect')) return 'walletConnect';
	if (hay.includes('coinbase')) return 'coinbase';
	if (hay.includes('phantom')) return 'phantom';
	if (hay.includes('metamask') || hay.includes('metaMask'.toLowerCase())) return 'metamask';
	if (id === 'injected' || name === 'injected' || name === 'browser wallet') return 'injected';
	return id || name || 'other';
};

const walletCopy = (kind, connector) => {
	if (kind === 'walletConnect') {
		return { label: 'WalletConnect', hint: 'Scan a QR code from a mobile wallet' };
	}
	if (kind === 'coinbase') {
		return { label: 'Coinbase Wallet', hint: 'Coinbase extension or app' };
	}
	if (kind === 'phantom') {
		return { label: 'Phantom', hint: 'Detected in this browser' };
	}
	if (kind === 'metamask') {
		return { label: 'MetaMask', hint: 'Popular browser extension' };
	}
	if (kind === 'injected') {
		return { label: 'Browser wallet', hint: 'Use the wallet already installed' };
	}
	return { label: connector.name || 'Wallet', hint: 'Continue with this wallet' };
};

const fallbackLogo = (kind) => {
	if (kind === 'walletConnect') return '/assets/images/logos/walletconnect.svg';
	if (kind === 'coinbase') return '/assets/images/logos/coinbase-wallet.svg';
	if (kind === 'phantom') return '/assets/images/logos/phantom.svg';
	if (kind === 'metamask') return '/assets/images/logos/metamask.svg';
	return '/assets/images/logos/browser-wallet.svg';
};

const shortAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletConnect = () => {
	const { address, isConnected } = useAccount();
	const { connectors, connectAsync, isPending } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChainAsync } = useSwitchChain();
	const [show, setShow] = useState(false);
	const [walletError, setWalletError] = useState('');
	const [pendingId, setPendingId] = useState('');

	const walletOptions = useMemo(() => {
		const seen = new Set();
		const options = [];

		connectors.forEach((connector) => {
			const kind = classifyWallet(connector);
			if (kind === 'walletConnect' && !WALLETCONNECT_READY) return;
			if (kind !== 'other' && seen.has(kind)) return;
			seen.add(kind);
			options.push({ connector, kind, ...walletCopy(kind, connector) });
		});

		const hasNamedInjected = options.some((item) => item.kind === 'metamask' || item.kind === 'phantom');
		return options.filter((item) => !(item.kind === 'injected' && hasNamedInjected));
	}, [connectors]);

	const closeModal = () => {
		if (isPending) return;
		setShow(false);
		setWalletError('');
		setPendingId('');
	};

	const handleConnectWallet = async (option) => {
		setWalletError('');
		setPendingId(option.connector.uid || option.connector.id);
		try {
			await connectAsync({ connector: option.connector, chainId: NETWORK_CHAIN_ID });
			try {
				await switchChainAsync({ chainId: NETWORK_CHAIN_ID });
			} catch (_switchError) {
				// Some wallets switch during connect.
			}
			setShow(false);
			setPendingId('');
		} catch (connectError) {
			setPendingId('');
			setWalletError(getWalletErrorMessage(connectError) || 'Wallet connection failed.');
		}
	};

	return (
		<>
			{isConnected && address ? (
				<button className="btn-wallet btn-wallet-disconnect" onClick={() => disconnect()} type="button">
					<span className="wallet-status-dot" />
					{shortAddress(address)}
				</button>
			) : (
				<button className="btn-wallet btn-wallet-connect" onClick={() => setShow(true)} type="button">
					CONNECT WALLET
				</button>
			)}
			<Modal
				isOpen={show}
				onRequestClose={closeModal}
				contentLabel="Connect wallet"
				className="wallet-picker-modal"
				overlayClassName="wallet-picker-overlay"
				closeTimeoutMS={220}
				style={{
					overlay: { backgroundColor: 'transparent' },
					content: {
						inset: 'unset',
						border: 'none',
						background: 'none',
						padding: 0,
						overflow: 'visible',
					},
				}}
			>
				<div className="wallet-picker">
					<button className="wallet-picker-close" type="button" onClick={closeModal} aria-label="Close">
						×
					</button>
					<div className="wallet-picker-header">
						<p className="wallet-picker-kicker">FolioDAO</p>
						<h2>Connect wallet</h2>
						<p>Choose a wallet to vote, create proposals, and claim rewards on Polygon.</p>
					</div>
					<div className="wallet-picker-list">
						{walletOptions.map((option) => {
							const busy = isPending && pendingId === (option.connector.uid || option.connector.id);
							return (
								<button
									key={option.connector.uid || option.connector.id}
									type="button"
									className={`wallet-picker-option${busy ? ' is-busy' : ''}`}
									onClick={() => handleConnectWallet(option)}
									disabled={isPending}
								>
									<span className="wallet-picker-icon">
										<img
											src={option.connector.icon || fallbackLogo(option.kind)}
											alt=""
										/>
									</span>
									<span className="wallet-picker-copy">
										<strong>{option.label}</strong>
										<small>{busy ? 'Waiting for approval…' : option.hint}</small>
									</span>
									<span className="wallet-picker-go">{busy ? '…' : '→'}</span>
								</button>
							);
						})}
					</div>
					{walletError ? <div className="wallet-picker-error">{walletError}</div> : null}
					<p className="wallet-picker-foot">Only connect a wallet you control. Polygon Mainnet is required.</p>
				</div>
			</Modal>
		</>
	);
};

export default WalletConnect;
