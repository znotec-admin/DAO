import { useState } from 'react'
import Link from 'next/link'
import Breatcome from '@/component/Breatcome/Breatcome'

const TOC = [
	{ id: 'abstract', label: '1. Abstract' },
	{ id: 'problem', label: '2. Problem' },
	{ id: 'design', label: '3. Design goals' },
	{ id: 'architecture', label: '4. Architecture' },
	{ id: 'lifecycle', label: '5. Proposal lifecycle' },
	{ id: 'eligibility', label: '6. Eligibility and weight' },
	{ id: 'auth', label: '7. Signed writes' },
	{ id: 'rewards', label: '8. Vesting and treasury' },
	{ id: 'security', label: '9. Security' },
	{ id: 'limits', label: '10. Limits and disclaimer' },
]

const Whitepaper = () => {
	const [paper, setPaper] = useState('technical')

	const printPaper = () => {
		if (typeof window !== 'undefined') {
			window.print()
		}
	}

	return (
		<>
			<Breatcome pageName='White Papers' />
			<div className="about-section pt-90 pb-100">
				<div className="container">
					<div className="row">
						<div className="col-lg-12">
							<div className="dreamit-section-title-two text-center pb-10">
								<div className="dreamit-section-main-title">
									<h1>FolioDAO <span>white papers</span></h1>
								</div>
								<div className="dreamit-section-content-text-inner">
									<p>Series 2026.1 — three companion papers for the Polygon dApp. Not an offering document.</p>
								</div>
							</div>
							<div className="tab-content text-center pb-30">
								<ul className="tabs">
									<li className={paper === 'technical' ? 'active' : ''} onClick={() => setPaper('technical')}>Technical paper</li>
									<li className={paper === 'governance' ? 'active' : ''} onClick={() => setPaper('governance')}>Governance spec</li>
									<li className={paper === 'glossary' ? 'active' : ''} onClick={() => setPaper('glossary')}>Glossary</li>
								</ul>
							</div>
						</div>
					</div>

					{paper === 'technical' ? (
						<div className="row">
							<div className="col-lg-3 mb-4">
								<nav className="whitepaper-toc">
									<p>Contents</p>
									{TOC.map((item) => (
										<a key={item.id} href={`#${item.id}`}>{item.label}</a>
									))}
									<button type="button" className="whitepaper-print" onClick={printPaper}>
										Save / print PDF
									</button>
									<Link href="/how-it-works">How it Works →</Link>
								</nav>
							</div>
							<div className="col-lg-9">
								<article className="whitepaper-article">
									<header className="whitepaper-meta">
										<span>Document ID WP-TECH-2026.1</span>
										<span>Network: Polygon 137</span>
										<span>Status: Living dApp paper</span>
									</header>

									<h3 id="abstract">1. Abstract</h3>
									<p>
										FolioDAO is an asset-backed, non-debt governance system. Holders of FOLIO (HODL), HOC, or FTO can propose treasury payouts and vote on them. Narrative text stays off-chain so descriptions and attachments can change without rewriting the ledger. Binding actions — create, vote, close, execute — stay on the HODLDAO contract. After each wallet confirmation the app syncs the Mongo row to the on-chain proposal id and re-reads tallies as strings.
									</p>
									<div className="whitepaper-callout">
										<strong>Non-debt rule.</strong> Execution pays an already-held FOLIO balance to a receiver. The contract does not mint against a loan or issue new debt.
									</div>

									<h3 id="problem">2. Problem</h3>
									<p>
										A pure on-chain ballot cannot store rich HTML, files, or later copy edits without expensive calldata. A pure database ballot can be rewritten after the fact. FolioDAO splits the two: Mongo holds title, sanitized HTML, period, and attachment path; HODLDAO holds start, end, receiver, amount, vote weights, and execution.
									</p>

									<h3 id="design">3. Design goals</h3>
									<ol>
										<li>One wallet signature per write, bound to action, address, time, extra, and a one-use nonce.</li>
										<li>The API never trusts a client-sent yes/no tally.</li>
										<li>Vote weights survive JavaScript’s 53-bit integer limit by staying strings.</li>
										<li>Cancel of a synced row requires <code>closeProposal</code> first.</li>
										<li>Reward UI is derived from <code>shares(account)</code>, not a hardcoded address list.</li>
									</ol>

									<h3 id="architecture">4. Architecture</h3>
									<pre className="whitepaper-flow">{`Wallet
  │  signed POST /api/proposals/create
  ├─► Mongo proposal (unsynced)
  │  HODLDAO.createProposal(mongoId, start, end, receiver, amountWei)
  └─► CreatedProposal(to, proposalId, id)
         signed POST /api/proposals/sync
            Mongo.token_id = proposalId

Wallet
  │  HODLDAO.vote(proposalId, yes)
  └─► signed POST /api/proposals/vote
         votes_yes / votes_no / approved ← chain`}</pre>
									<table className="whitepaper-table">
										<thead>
											<tr>
												<th>Layer</th>
												<th>Stores</th>
												<th>Authority</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>Next.js 14 Pages Router</td>
												<td>UI, signed API routes</td>
												<td>Same origin <code>/api/</code></td>
											</tr>
											<tr>
												<td>MongoDB</td>
												<td>Title, HTML, times, sync flag, string tallies</td>
												<td>Proposer + nonce</td>
											</tr>
											<tr>
												<td>HODLDAO</td>
												<td>Receiver, amount, weights, status</td>
												<td>Wallet tx</td>
											</tr>
											<tr>
												<td>PaymentSplitter</td>
												<td>Payee shares, releasable FOLIO</td>
												<td>Payee <code>release()</code></td>
											</tr>
										</tbody>
									</table>

									<h3 id="lifecycle">5. Proposal lifecycle</h3>
									<table className="whitepaper-table">
										<thead>
											<tr>
												<th>Status</th>
												<th>On-chain enum</th>
												<th>Who may act</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>Pending</td>
												<td>0</td>
												<td>Created; waiting for <code>start_at</code></td>
											</tr>
											<tr>
												<td>Live</td>
												<td>1</td>
												<td>Eligible wallets vote once</td>
											</tr>
											<tr>
												<td>Closed</td>
												<td>2</td>
												<td>Owner, proposer, or anyone after <code>end_at</code></td>
											</tr>
											<tr>
												<td>Executed</td>
												<td>3</td>
												<td>DAO owner after approval and window</td>
											</tr>
										</tbody>
									</table>
									<p>
										UI lists are time-sliced: live is <code>start_at &lt; now &lt; end_at</code>, pending is <code>start_at &gt; now</code>, past is <code>end_at &lt; now</code>. Periods offered in the form are 10 minutes, 24 hours, 48 hours, and 72 hours.
									</p>

									<h3 id="eligibility">6. Eligibility and weight</h3>
									<p>
										Defaults in the HODLDAO contract require at least 1 token (18 decimals) of FOLIO, HOC, or FTO to propose or vote. Those floors are owner-settable. Vote weight is the voter’s FOLIO balance when that balance meets the FOLIO floor; otherwise an eligible voter casts weight 1.
									</p>
									<pre className="whitepaper-flow">{`ableToPropose = bal(FOLIO) ≥ floorW
              ∨ bal(HOC) ≥ floorH
              ∨ bal(FTO) ≥ floorF

weight(account) =
  0                         if not ableToVote
  bal(FOLIO)              if bal(FOLIO) ≥ voteFloorW
  1                         otherwise

approved  ⇔  votes_yes * 100 ≥ (votes_yes + votes_no) * approvalPercent
default approvalPercent = 51`}</pre>

									<h3 id="auth">7. Signed writes</h3>
									<pre className="whitepaper-flow">{`FOLIODAO
action:<create|sync|vote|cancel|delete|attachfile>
address:<lowercase wallet>
timestamp:<unix ms>
extra:<mongo id when required>
nonce:<16–64 hex chars>`}</pre>
									<p>
										The signature must recover to <code>address</code>, be no older than five minutes, and consume a nonce stored in <code>auth_nonces</code> (TTL 10 minutes). Create, sync, cancel, and delete also require the signer to be the proposer. Sync, vote, cancel, and delete bind <code>extra</code> to the Mongo id.
									</p>
									<table className="whitepaper-table">
										<thead>
											<tr>
												<th>Method</th>
												<th>Route</th>
												<th>Auth</th>
											</tr>
										</thead>
										<tbody>
											<tr><td>GET</td><td>/api/proposals/live|pending|past|:id</td><td>None</td></tr>
											<tr><td>POST</td><td>/api/proposals/create</td><td>Signer = proposer</td></tr>
											<tr><td>POST</td><td>/api/proposals/sync</td><td>Signer = proposer + extra</td></tr>
											<tr><td>POST</td><td>/api/proposals/vote</td><td>Any signed voter + extra</td></tr>
											<tr><td>POST</td><td>/api/proposals/cancel</td><td>Proposer + extra; chain closed</td></tr>
											<tr><td>POST</td><td>/api/proposals/attachfile</td><td>Signed multipart</td></tr>
										</tbody>
									</table>

									<h3 id="rewards">8. Vesting and treasury</h3>
									<p>
										Founder, team, equity, and CTO splitters follow OpenZeppelin-style payees. The <code>/reward</code> page shows a tile only when <code>shares(account) &gt; 0</code> and a Release control only when <code>releasable(FOLIO, account) &gt; 0</code>. Treasury tiles on home and vote are read-only <code>balanceOf</code> calls for named org wallets.
									</p>

									<h3 id="security">9. Security</h3>
									<ul>
										<li>Uploads: generated names, allowlisted extensions, 5 MB cap, <code>/uploads</code> only.</li>
										<li>HTML: <code>sanitize-html</code> with http(s) and <code>/uploads/</code> hrefs.</li>
										<li>Wallets: wagmi 2 + viem; WalletConnect v2 is optional behind a project id.</li>
										<li>Hydration: live/past reads copy string tallies and <code>approved</code> from chain.</li>
									</ul>

									<h3 id="limits">10. Limits and disclaimer</h3>
									<p>
										Owner keys can change floors, token addresses, and approval percent, and can execute payouts. This paper describes the current dApp and in-repo Solidity. It is not investment, tax, or legal advice and not an offer of securities. Walkthrough: <Link href="/how-it-works">How it Works</Link>.
									</p>
									<p className="whitepaper-rev">Revisions: 2026.1 initial hybrid paper · 2026.1.1 added weight formula, API table, and paper series.</p>
								</article>
							</div>
						</div>
					) : null}

					{paper === 'governance' ? (
						<div className="row justify-content-center">
							<div className="col-lg-10">
								<article className="whitepaper-article">
									<header className="whitepaper-meta">
										<span>Document ID WP-GOV-2026.1</span>
										<span>Companion to WP-TECH-2026.1</span>
									</header>
									<h3>1. Roles</h3>
									<table className="whitepaper-table">
										<thead>
											<tr><th>Role</th><th>How it is decided</th><th>Powers</th></tr>
										</thead>
										<tbody>
											<tr>
												<td>Proposer</td>
												<td><code>checkAbleToProposal</code></td>
												<td>Create, sync, cancel, delete own row</td>
											</tr>
											<tr>
												<td>Voter</td>
												<td><code>checkAbleToVote</code></td>
												<td>One vote per live proposal</td>
											</tr>
											<tr>
												<td>DAO owner / COO</td>
												<td><code>owner()</code></td>
												<td>Execute, close, set floors and tokens</td>
											</tr>
											<tr>
												<td>Payee</td>
												<td>Splitter <code>shares &gt; 0</code></td>
												<td>Release vested FOLIO</td>
											</tr>
										</tbody>
									</table>
									<h3>2. Execution invariant</h3>
									<p>
										<code>exeProposal</code> requires the caller to be owner, the proposal not already executed, <code>block.timestamp &gt; end_at</code>, and <code>checkApproved</code>. It then transfers <code>amount</code> FOLIO from the DAO contract to <code>receiver</code>. If the contract holds less than <code>amount</code>, the transaction reverts.
									</p>
									<h3>3. Cancel invariant</h3>
									<p>
										The API rejects cancel while on-chain status is still Pending or Live. The client must send <code>closeProposal</code> first. Delete of a synced row is blocked until <code>canceled</code> is true.
									</p>
									<h3>4. Period policy</h3>
									<p>
										The form maps period codes 10 / 24 / 48 / 72 to 600 seconds or 24 / 48 / 72 hours from <code>start_at = now</code>. The contract only checks <code>end &gt; start</code>.
									</p>
									<h3>5. Failure modes</h3>
									<ul>
										<li>User rejects the wallet prompt — no Mongo write is treated as final for on-chain state.</li>
										<li>Create succeeds and the chain tx fails — an unsynced Mongo row remains; the proposer can retry or delete.</li>
										<li>RPC rate limits — the UI asks the user to retry or use the wallet’s own provider.</li>
									</ul>
									<div className="slider-btn mt-4">
										<button type="button" className="whitepaper-text-link" onClick={() => setPaper('technical')}>
											← Technical paper
										</button>
									</div>
								</article>
							</div>
						</div>
					) : null}

					{paper === 'glossary' ? (
						<div className="row justify-content-center">
							<div className="col-lg-10">
								<article className="whitepaper-article">
									<header className="whitepaper-meta">
										<span>Document ID WP-GLOSS-2026.1</span>
									</header>
									<table className="whitepaper-table">
										<thead>
											<tr><th>Term</th><th>Meaning in this dApp</th></tr>
										</thead>
										<tbody>
											<tr><td>HODLDAO</td><td>Governance contract the frontend calls.</td></tr>
											<tr><td>FOLIO / HODL</td><td>Primary ERC-20 used for balances, vote weight, and payouts.</td></tr>
											<tr><td>HOC</td><td>Secondary ERC-20 that can satisfy propose/vote floors.</td></tr>
											<tr><td>FTO</td><td>Third ERC-20 that can satisfy propose/vote floors.</td></tr>
											<tr><td>token_id</td><td>On-chain proposal number minted to the proposer.</td></tr>
											<tr><td>extra</td><td>Mongo proposal id bound into the signed message.</td></tr>
											<tr><td>nonce</td><td>One-use hex value that blocks replay for ten minutes.</td></tr>
											<tr><td>shares</td><td>Splitter units that unlock a reward tile.</td></tr>
											<tr><td>releasable</td><td>Pending FOLIO a payee can claim now.</td></tr>
											<tr><td>Intelligent contract</td><td>Here: the hybrid of signed API + HODLDAO, not a separate VM.</td></tr>
										</tbody>
									</table>
									<p>
										Related walkthrough: <Link href="/how-it-works">How it Works</Link>. Related surfaces: <Link href="/vote">Vote</Link>, <Link href="/reward">Reward</Link>.
									</p>
								</article>
							</div>
						</div>
					) : null}
				</div>
			</div>
			<style jsx>{`
				.whitepaper-toc {
					position: sticky;
					top: 90px;
					padding: 18px 16px;
					border-radius: 16px;
					background: rgba(9, 24, 94, 0.08);
				}
				.whitepaper-toc p {
					margin: 0 0 10px;
					font-weight: 700;
				}
				.whitepaper-toc a,
				.whitepaper-toc button,
				.whitepaper-text-link {
					display: block;
					margin: 6px 0;
					color: inherit;
					background: none;
					border: 0;
					padding: 0;
					text-align: left;
					cursor: pointer;
				}
				.whitepaper-print {
					margin-top: 14px !important;
					color: #c9a227 !important;
					font-weight: 700;
				}
				.whitepaper-meta {
					display: flex;
					flex-wrap: wrap;
					gap: 10px 18px;
					margin-bottom: 1.5rem;
					font-size: 13px;
					opacity: 0.8;
				}
				.whitepaper-article h3 {
					margin: 2.2rem 0 0.8rem;
				}
				.whitepaper-article p,
				.whitepaper-article li,
				.whitepaper-article td,
				.whitepaper-article th {
					font-size: 16px;
					line-height: 1.7;
				}
				.whitepaper-callout {
					margin: 1.25rem 0;
					padding: 14px 16px;
					border-left: 4px solid #f5c14a;
					background: rgba(245, 193, 74, 0.12);
				}
				.whitepaper-flow {
					overflow-x: auto;
					padding: 16px;
					border-radius: 12px;
					background: #0b1433;
					color: #d7e0ff;
					font-size: 13px;
					line-height: 1.55;
				}
				.whitepaper-table {
					width: 100%;
					margin: 1rem 0 1.5rem;
					border-collapse: collapse;
				}
				.whitepaper-table th,
				.whitepaper-table td {
					padding: 10px 12px;
					border: 1px solid rgba(255, 255, 255, 0.12);
					text-align: left;
					vertical-align: top;
				}
				.whitepaper-rev {
					margin-top: 2rem;
					font-size: 13px;
					opacity: 0.7;
				}
				@media print {
					:global(.header-area),
					:global(.footer),
					:global(.breatcome-area),
					:global(.tabs),
					.whitepaper-toc {
						display: none !important;
					}
				}
			`}</style>
		</>
	)
}

export default Whitepaper
