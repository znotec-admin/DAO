# FolioDAO contracts

Solidity sources that match the Next.js app in this repo (`abi/ABI.json`, `abi/SPLITTER.json`, `utils/web3api.ts`).

| Contract | Role |
| --- | --- |
| `FolioDAO.sol` | Governance: create proposal, vote, execute payout |
| `FolioToken.sol` | ERC-20 for HODL / HOC / FTO |
| `PaymentSplitter.sol` | Founder / team / equity / CTO `releasable` + `release` |

## Governance rules

- **Create** — caller must hold at least one of `proposalAllowedFolioAmount`, `proposalAllowedHOCAmount`, or `proposalAllowedFTOAmount`.
- **Vote** — same idea with the vote thresholds. Weight is the FOLIO (HODL) balance if that threshold is met, otherwise `1`.
- **Approve** — `votes_yes * 100 >= (votes_yes + votes_no) * approvalPercent` (default 51%).
- **Execute** — owner (`COO`) calls `exeProposal` after the end time. The DAO contract must already hold enough FOLIO.

Revert strings used by the UI: `invalid address`, `unexistent proposal`, `you voted already`, `no live proposal`, `caller is not the coo`, `account has no shares`.

## Suggested deploy order (Polygon)

1. Deploy `FolioToken` three times (HODL, HOC, FTO) or point at existing tokens.
2. Deploy `FolioDAO(hodl, hoc, fto)`.
3. Deploy `PaymentSplitter(payees, shares)` for founders, team, equity, and CTO.
4. Fund the DAO and splitters with HODL.
5. Put the new addresses in `utils/_constants.ts` (or env) and keep using `abi/ABI.json` / `abi/SPLITTER.json`.

Example constructor args:

```text
FolioToken("FOLIO", "HODL", 100000000000000000000000000, <treasury>)
FolioDAO(<hodl>, <hoc>, <fto>)
PaymentSplitter([<addr1>, <addr2>], [50, 50])
```

Compile with Solidity `0.8.20` (Remix, Foundry, or Hardhat). These files are self-contained and do not require OpenZeppelin as a package.
