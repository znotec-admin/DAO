import Link from 'next/link'
import Breatcome from '@/component/Breatcome/Breatcome'

const STEPS = [
	{
		title: '1. Connect on Polygon',
		text: 'Open CONNECT WALLET and use MetaMask, Coinbase Wallet, Phantom, or WalletConnect. The app targets Polygon Mainnet (chain ID 137).',
		href: '/',
		cta: 'Go to home',
	},
	{
		title: '2. Check eligibility',
		text: 'The HODLDAO contract decides who can propose or vote. /vote shows your FOLIO and FTO balances and those checks before you submit anything.',
		href: '/vote',
		cta: 'Open Vote',
	},
	{
		title: '3. Create a proposal',
		text: 'Eligible wallets write title, description, recipient, amount, and period. Metadata is stored in MongoDB, then HODLDAO.createProposal is sent from your wallet. After the transaction confirms, the record is synced to the on-chain proposal id.',
		href: '/vote',
		cta: 'Create on Vote',
	},
	{
		title: '4. Vote while it is live',
		text: 'Live proposals accept Approve or Deny through HODLDAO.vote. Vote weights stay as strings so large tallies do not lose precision. Lists refresh from the contract on read.',
		href: '/vote',
		cta: 'See live proposals',
	},
	{
		title: '5. Cancel or execute',
		text: 'The proposer can cancel and must close the proposal on-chain first if it was synced. After the vote window, the DAO owner can execute an approved payout with HODLDAO.exeProposal.',
		href: '/vote',
		cta: 'Review past votes',
	},
	{
		title: '6. Claim vested shares',
		text: 'Founder, team, equity, and CTO tiles on /reward appear only when the splitter reports shares(account) > 0. Release is enabled when releasable is greater than zero.',
		href: '/reward',
		cta: 'Open Reward',
	},
]

const HowItWorks = () => {
	return (
		<>
			<Breatcome pageName='How it Works' />
			<div className="why-choose-section pt-90 pb-80">
				<div className="container">
					<div className="row">
						<div className="col-lg-12">
							<div className="dreamit-section-title-two text-center pb-20">
								<div className="dreamit-section-main-title">
									<h1>How <span>FolioDAO</span> works</h1>
								</div>
								<div className="dreamit-section-content-text-inner">
									<p>Governance is a hybrid: proposal text lives in MongoDB, create and vote happen on HODLDAO, and the two sides sync after your wallet confirms the transaction.</p>
								</div>
							</div>
						</div>
					</div>
					<div className="row pt-30">
						{STEPS.map((step) => (
							<div className="col-lg-4 col-md-6 mb-4" key={step.title}>
								<div className="single-why-choose-box">
									<div className="why-choose-content">
										<h2>{step.title}</h2>
										<p>{step.text}</p>
										<div className="how-step-cta mt-3">
											<Link href={step.href}>{step.cta}</Link>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
					<div className="row pt-10">
						<div className="col-lg-12">
							<div className="how-next">
								<h3>Next steps</h3>
								<p>Read the technical paper, governance spec, and glossary — then open Vote.</p>
								<div className="how-next-actions">
									<Link href="/whitepaper" className="how-next-primary">
										White Papers
									</Link>
									<Link href="/vote" className="how-next-secondary">
										Open Vote
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<style jsx>{`
				.how-step-cta :global(a) {
					display: inline-block;
					background: #0194FC;
					color: #fff !important;
					padding: 10px 28px;
					border-radius: 5px;
					font-size: 15px;
					font-weight: 600;
				}
				.how-next {
					margin-top: 20px;
					padding: 36px 28px;
					text-align: center;
					border-radius: 16px;
					background: #091A60;
				}
				.how-next h3 {
					margin: 0 0 10px;
					color: #fff;
					font-size: 26px;
				}
				.how-next p {
					margin: 0 0 22px;
					color: #d7e4ff;
					font-size: 16px;
					font-weight: 500;
				}
				.how-next-actions {
					display: flex;
					flex-wrap: wrap;
					justify-content: center;
					gap: 14px;
				}
				.how-next :global(a.how-next-primary),
				.how-next :global(a.how-next-secondary) {
					display: inline-block;
					padding: 14px 32px;
					border-radius: 30px;
					font-size: 15px;
					font-weight: 700;
					line-height: 1.2;
				}
				.how-next :global(a.how-next-primary) {
					background: #0194FC;
					color: #fff !important;
				}
				.how-next :global(a.how-next-secondary) {
					background: transparent;
					border: 1px solid #fff;
					color: #fff !important;
				}
			`}</style>
		</>
	)
}

export default HowItWorks
