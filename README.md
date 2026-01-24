# FolioDAO

A Next.js Web3 app for **FolioDAO** on Polygon. It combines a public marketing site with wallet-gated governance, vesting claims, and treasury balance views.

Proposal **text and attachments** are stored in MongoDB. Proposal **creation and voting** happen on the HODLDAO contract. The two sides are synced after the wallet transaction confirms.

## Features

### Wallet and chain
- Connect with MetaMask, WalletConnect v2, or Coinbase Wallet (wagmi + viem)
- WalletConnect needs `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Switch or add Polygon Mainnet (chain ID 137)
- RPC from `NEXT_PUBLIC_RPC_URL`, then public Polygon endpoints
- HODL and FTO balances for the connected wallet

### Governance (`/vote`)
- Create a proposal (Mongo metadata, then `HODLDAO.createProposal`)
- Vote Approve / Deny on live proposals (`HODLDAO.vote`)
- Eligibility checks from the contract (`checkAbleToProposal`, `checkAbleToVote`)
- Live, pending, and past lists
- DAO owner can execute an approved past proposal (`HODLDAO.exeProposal`)
- Optional attachment (type-checked, renamed on disk)
- Write APIs require a signed wallet message

### Rewards (`/reward`)
- Founder, team, equity, and CTO tiles appear only when `shares(account) > 0`
- Claims use splitter `release()`

### Treasury
- Live HODL balances for named organizational wallets on the home page and `/vote`

### Marketing
- Home, about, contact, blog, team, token, roadmap, FAQ, How it Works, and White Papers pages

## Architecture

| Layer | Role |
| --- | --- |
| Next.js 14 Pages Router + TypeScript | UI and API routes |
| MongoDB / Mongoose | Proposal title, HTML body, times, sync flag, vote tallies |
| wagmi + viem + web3.js 1.9 | Wallet connect (WC v2) and contract calls |
| Polygon Mainnet | HODLDAO, HODL/HOC/FTO, payment splitters |

```
Wallet  →  POST /api/proposals/create (signed)
        →  HODLDAO.createProposal(...)
        →  POST /api/proposals/sync (signed)

Wallet  →  HODLDAO.vote(proposalId, yes)
        →  POST /api/proposals/vote (signed)
```

## Requirements

- Node.js 18 or newer (including Node 24). Next 14.2 is the Pages Router release used here.
- npm
- MongoDB reachable at `MONGO_URI`

The repo includes `.npmrc` with `legacy-peer-deps=true` so install works with React 18 and `react-currency-format`.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set at least:

```env
MONGO_URI=mongodb://localhost/proposal
NEXT_PUBLIC_RPC_URL=https://polygon-bor-rpc.publicnode.com
NEXT_PUBLIC_API_BASE_URL=/api/
NEXT_PUBLIC_NETWORK_CHAIN_ID=137
NEXT_PUBLIC_NETWORK_CHAIN_NAME=polygon-mainnet
```

Optional:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect v2 (Reown Cloud). MetaMask and Coinbase work without it.
- `NEXT_PUBLIC_INFURA_PROJECT_ID` — optional public RPC fallback
- `ETHERSCAN_API_KEY` / `POLYGONSCAN_API_KEY` — explorer helpers
- `NEXT_PUBLIC_HODLDAO_ADDRESS` and other `NEXT_PUBLIC_*_ADDRESS` keys — override Polygon contract defaults in `utils/_constants.ts`

Do not commit `.env`. API keys that used to live in `utils/_constants.ts` must stay in environment variables. If those keys were ever pushed to git, rotate them.

**Windows:** use one `npm run dev` process only. Dev webpack cache uses memory on Windows to avoid `EBUSY` pack-file rename errors. If `.next` still locks, stop the server, delete `.next`, and start again. In PowerShell, use `;` instead of `&&` when chaining commands.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Production server (run `build` first) |
| `npm run lint` | Next.js lint |
| `npm test` | Auth, sanitize, vote-weight, and helper unit tests |

## API

Read (no wallet signature):

- `GET /api/health`
- `GET /api/proposals` — synced, non-canceled proposals
- `GET /api/proposals/live\|pending\|past`
- `GET /api/proposals/:id`
- `GET /api/prices`, `/api/prices/:id`, `/api/prices/tokens`

Write (wallet signature required):

- `POST /api/proposals/create`
- `POST /api/proposals/sync`
- `POST /api/proposals/vote`
- `POST /api/proposals/cancel`
- `POST /api/proposals/delete`
- `POST /api/proposals/attachfile`

Signature message format:

```
FOLIODAO
action:<action>
address:<lowercase wallet>
timestamp:<ms>
extra:<optional>
nonce:<32 hex chars>
```

The signature must be from the same wallet, include a one-use nonce, and be no older than 5 minutes. A used nonce is rejected. Create / sync / cancel / delete also require the signer to be the proposer. Sync, vote, cancel, and delete bind `extra` to the Mongo proposal id. Cancel of a synced proposal requires `HODLDAO.closeProposal` first. Live/past lists refresh tallies from the contract on read. Vote weights (`votes_yes`, `votes_no`) are stored and compared as strings so wei-sized counts do not lose JavaScript precision.

Uploads go to `public/uploads` with a generated filename. Allowed types: pdf, png, jpg, jpeg, gif, webp, doc, docx, txt. Max size 5 MB.

## Contracts

Solidity sources live in [`contracts/`](./contracts). They match `abi/ABI.json` and `abi/SPLITTER.json` so the existing frontend can point at a new deploy.

Configured via `NEXT_PUBLIC_*_ADDRESS` env vars (Polygon defaults in `utils/_constants.ts`):

- HODLDAO / HOCDAO — governance
- HODL / HOC / FTO — tokens
- Founders, team, equity, and CTO splitters — vesting
- Named treasury wallets — read-only balances

Token amounts use 18-decimal `ether` units.

## Deploy

Any Node host that can run `npm run build` and `npm start` works, including [Vercel](https://vercel.com). Set the same environment variables in the host. The API base defaults to `/api/` so the browser calls the same origin.

## Docs

- [Backend / blockchain requirements](./REQUIREMENTS.md)
- [Next.js documentation](https://nextjs.org/docs)
