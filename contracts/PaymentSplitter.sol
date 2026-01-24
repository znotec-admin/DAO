// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";

/// @title PaymentSplitter
/// @notice Matches the app's SPLITTER ABI (OpenZeppelin-style payees + ERC-20 release).
contract PaymentSplitter {
    event PayeeAdded(address account, uint256 shares);
    event PaymentReleased(address to, uint256 amount);
    event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    uint256 public totalShares;
    uint256 public totalReleased;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;
    mapping(IERC20 => uint256) public erc20TotalReleased;
    mapping(IERC20 => mapping(address => uint256)) public erc20Released;
    address[] private _payees;

    constructor(address[] memory payees, uint256[] memory shares_) payable {
        require(payees.length == shares_.length, "payees and shares length mismatch");
        require(payees.length > 0, "no payees");

        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares_[i]);
        }
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function payee(uint256 index) public view returns (address) {
        return _payees[index];
    }

    function releasable(address account) public view returns (uint256) {
        uint256 totalReceived = address(this).balance + totalReleased;
        return _pendingPayment(account, totalReceived, released[account]);
    }

    function releasable(IERC20 token, address account) public view returns (uint256) {
        uint256 totalReceived = token.balanceOf(address(this)) + erc20TotalReleased[token];
        return _pendingPayment(account, totalReceived, erc20Released[token][account]);
    }

    function release(address payable account) public {
        require(shares[account] > 0, "account has no shares");
        uint256 payment = releasable(account);
        require(payment != 0, "account is not due payment");

        totalReleased += payment;
        released[account] += payment;
        (bool ok, ) = account.call{value: payment}("");
        require(ok, "native transfer failed");
        emit PaymentReleased(account, payment);
    }

    function release(IERC20 token, address account) public {
        require(shares[account] > 0, "account has no shares");
        uint256 payment = releasable(token, account);
        require(payment != 0, "account is not due payment");

        erc20TotalReleased[token] += payment;
        erc20Released[token][account] += payment;
        require(token.transfer(account, payment), "token transfer failed");
        emit ERC20PaymentReleased(token, account, payment);
    }

    function _pendingPayment(
        address account,
        uint256 totalReceived,
        uint256 alreadyReleased
    ) private view returns (uint256) {
        return (totalReceived * shares[account]) / totalShares - alreadyReleased;
    }

    function _addPayee(address account, uint256 shares_) private {
        require(account != address(0), "invalid address");
        require(shares_ > 0, "shares are 0");
        require(shares[account] == 0, "account already has shares");

        _payees.push(account);
        shares[account] = shares_;
        totalShares += shares_;
        emit PayeeAdded(account, shares_);
    }
}
