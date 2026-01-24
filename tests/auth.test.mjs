import assert from 'node:assert/strict';
import test from 'node:test';
import Web3 from 'web3';

import { buildAuthMessage, verifyWalletSignature } from '../utils/auth.ts';
import { sanitizeHtml } from '../utils/sanitize.ts';
import { parseProposalId } from '../utils/chainRead.ts';
import { sameAddress } from '../utils/helpers.ts';
import { votePercents, voteWeight } from '../utils/voteMath.ts';

const web3 = new Web3();
const account = web3.eth.accounts.create();

const signAuth = ({ action, extra = '', nonce, timestamp = Date.now() }) => {
	const message = buildAuthMessage({
		action,
		address: account.address,
		timestamp,
		extra,
		nonce,
	});
	const { signature } = web3.eth.accounts.sign(message, account.privateKey);
	return { address: account.address, signature, timestamp, action, extra, nonce };
};

test('buildAuthMessage includes action, address, extra, and nonce', () => {
	const message = buildAuthMessage({
		action: 'vote',
		address: account.address,
		timestamp: 123,
		extra: 'abc',
		nonce: 'aa'.repeat(16),
	});
	assert.match(message, /^FOLIODAO\n/);
	assert.match(message, /action:vote/);
	assert.match(message, new RegExp(`address:${account.address.toLowerCase()}`));
	assert.match(message, /extra:abc/);
	assert.match(message, /nonce:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
});

test('verifyWalletSignature accepts a fresh signed payload', () => {
	const payload = signAuth({ action: 'create', nonce: 'bb'.repeat(16) });
	const recovered = verifyWalletSignature(payload);
	assert.equal(recovered.toLowerCase(), account.address.toLowerCase());
});

test('verifyWalletSignature rejects an expired timestamp', () => {
	const payload = signAuth({
		action: 'vote',
		nonce: 'cc'.repeat(16),
		timestamp: Date.now() - (6 * 60 * 1000),
	});
	assert.throws(() => verifyWalletSignature(payload), /expired/i);
});

test('verifyWalletSignature rejects a missing nonce', () => {
	const payload = signAuth({ action: 'sync', nonce: 'dd'.repeat(16) });
	delete payload.nonce;
	assert.throws(() => verifyWalletSignature(payload), /required/i);
});

test('sanitizeHtml strips scripts and unsafe hrefs', () => {
	const dirty = '<p>Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><a href="https://dao.example">ok</a>';
	const clean = sanitizeHtml(dirty);
	assert.equal(clean.includes('<script>'), false);
	assert.equal(clean.includes('javascript:'), false);
	assert.match(clean, /https:\/\/dao\.example/);
});

test('parseProposalId accepts positive integers only', () => {
	assert.equal(parseProposalId('12'), 12);
	assert.throws(() => parseProposalId('0'), /invalid/i);
	assert.throws(() => parseProposalId('abc'), /invalid/i);
});

test('sameAddress compares wallets case-insensitively', () => {
	assert.equal(sameAddress(account.address, account.address.toLowerCase()), true);
	assert.equal(sameAddress(account.address, '0x0000000000000000000000000000000000000001'), false);
});

test('voteWeight keeps wei-sized counts as strings', () => {
	const wei = '9007199254740993';
	assert.equal(voteWeight(wei), wei);
	assert.notEqual(Number(wei).toString(), wei);
	assert.equal(voteWeight(12), '12');
	assert.equal(voteWeight(null), '0');
});

test('votePercents uses BigNumber ratios instead of Number()', () => {
	const percents = votePercents('300000000000000000000', '100000000000000000000');
	assert.equal(percents.yes, 75);
	assert.equal(percents.no, 25);
	assert.deepEqual(votePercents('0', '0'), { yes: 0, no: 0 });
});
