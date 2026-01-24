// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";

/// @title FolioDAO
/// @notice On-chain governance used by the FolioDAO Next.js app.
/// Function names, events, and revert strings match `abi/ABI.json` and `utils/web3api.ts`.
contract FolioDAO {
    enum ProposalStatus {
        Pending,
        Live,
        Closed,
        Executed
    }

    enum VoterState {
        None,
        Yes,
        No
    }

    struct Proposal {
        string id;
        ProposalStatus status;
        uint256 votes_yes;
        uint256 votes_no;
        uint256 start_at;
        uint256 end_at;
        address receiver;
        uint256 amount;
        bool executed;
    }

    event CreatedProposal(address indexed to, uint256 indexed proposalId, string id);
    event Voted(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 votes_yes,
        uint256 votes_no,
        bool approved
    );
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    string public name = "FolioDAO Proposal";
    string public symbol = "WPROP";

    address public owner;
    IERC20 public folio;
    IERC20 public hoc;
    IERC20 public fto;
    uint256 public currentFtoId;

    uint256 public approvalPercent = 51;
    uint256 public proposalAllowedFolioAmount = 1 ether;
    uint256 public proposalAllowedHOCAmount = 1 ether;
    uint256 public proposalAllowedFTOAmount = 1 ether;
    uint256 public voteAllowedFolioAmount = 1 ether;
    uint256 public voteAllowedHOCAmount = 1 ether;
    uint256 public voteAllowedFTOAmount = 1 ether;

    uint256 public totalSupply;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(address => uint256[]) private _ownedProposals;
    uint256[] private _allProposals;

    mapping(uint256 => Proposal) private _proposals;
    mapping(string => uint256) private _proposalIdByKey;
    mapping(uint256 => mapping(address => VoterState)) public votes;

    modifier onlyOwner() {
        require(msg.sender == owner, "caller is not the coo");
        _;
    }

    constructor(address _folio, address _folioHOC, address _fto) {
        require(_folio != address(0) && _folioHOC != address(0) && _fto != address(0), "invalid address");
        owner = msg.sender;
        folio = IERC20(_folio);
        hoc = IERC20(_folioHOC);
        fto = IERC20(_fto);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function ownerOf(uint256 proposalId) public view returns (address) {
        address proposalOwner = _owners[proposalId];
        require(proposalOwner != address(0), "unexistent proposal");
        return proposalOwner;
    }

    function proposalByIndex(uint256 index) public view returns (uint256) {
        require(index < _allProposals.length, "index out of bounds");
        return _allProposals[index];
    }

    function proposalOfOwnerByIndex(address proposalOwner, uint256 index) public view returns (uint256) {
        require(index < _ownedProposals[proposalOwner].length, "index out of bounds");
        return _ownedProposals[proposalOwner][index];
    }

    function checkAbleToProposal(address account) public view returns (bool) {
        return
            _tokenBalance(folio, account) >= proposalAllowedFolioAmount ||
            _tokenBalance(hoc, account) >= proposalAllowedHOCAmount ||
            _tokenBalance(fto, account) >= proposalAllowedFTOAmount;
    }

    function checkAbleToVote(address account) public view returns (bool) {
        return
            _tokenBalance(folio, account) >= voteAllowedFolioAmount ||
            _tokenBalance(hoc, account) >= voteAllowedHOCAmount ||
            _tokenBalance(fto, account) >= voteAllowedFTOAmount;
    }

    function getVoteCount(address account) public view returns (uint256) {
        if (!checkAbleToVote(account)) {
            return 0;
        }
        uint256 folioBal = _tokenBalance(folio, account);
        if (folioBal >= voteAllowedFolioAmount) {
            return folioBal;
        }
        return 1;
    }

    function getProposal(uint256 proposalId) public view returns (Proposal memory) {
        require(_exists(proposalId), "unexistent proposal");
        Proposal memory proposal = _proposals[proposalId];
        proposal.status = _statusOf(proposal);
        return proposal;
    }

    function getProposalById(string calldata id) public view returns (Proposal memory) {
        uint256 proposalId = _proposalIdByKey[id];
        require(proposalId != 0, "unexistent proposal");
        return getProposal(proposalId);
    }

    function checkApproved(uint256 proposalId) public view returns (bool) {
        require(_exists(proposalId), "unexistent proposal");
        return _isApproved(_proposals[proposalId]);
    }

    function createProposal(
        string calldata id,
        uint256 start,
        uint256 end,
        address receiver,
        uint256 amount
    ) external returns (uint256) {
        require(checkAbleToProposal(msg.sender), "not able to proposal");
        require(receiver != address(0), "invalid address");
        require(bytes(id).length > 0, "invalid id");
        require(_proposalIdByKey[id] == 0, "proposal id exists");
        require(end > start, "invalid period");

        uint256 proposalId = totalSupply + 1;
        totalSupply = proposalId;

        _proposals[proposalId] = Proposal({
            id: id,
            status: ProposalStatus.Pending,
            votes_yes: 0,
            votes_no: 0,
            start_at: start,
            end_at: end,
            receiver: receiver,
            amount: amount,
            executed: false
        });
        _proposalIdByKey[id] = proposalId;
        _mint(msg.sender, proposalId);

        emit CreatedProposal(msg.sender, proposalId, id);
        return proposalId;
    }

    function vote(uint256 proposalId, bool yes) external {
        require(_exists(proposalId), "unexistent proposal");
        require(checkAbleToVote(msg.sender), "not able to vote");
        require(votes[proposalId][msg.sender] == VoterState.None, "you voted already");

        Proposal storage proposal = _proposals[proposalId];
        require(_isLive(proposal), "no live proposal");

        uint256 weight = getVoteCount(msg.sender);
        require(weight > 0, "not able to vote");

        if (yes) {
            proposal.votes_yes += weight;
            votes[proposalId][msg.sender] = VoterState.Yes;
        } else {
            proposal.votes_no += weight;
            votes[proposalId][msg.sender] = VoterState.No;
        }

        bool approved = _isApproved(proposal);
        emit Voted(msg.sender, proposalId, proposal.votes_yes, proposal.votes_no, approved);
    }

    function closeProposal(uint256 proposalId) external {
        require(_exists(proposalId), "unexistent proposal");
        Proposal storage proposal = _proposals[proposalId];
        require(!proposal.executed, "already executed");
        require(
            msg.sender == owner || msg.sender == _owners[proposalId] || block.timestamp > proposal.end_at,
            "caller is not the coo"
        );
        proposal.status = ProposalStatus.Closed;
    }

    function exeProposal(uint256 proposalId) external onlyOwner {
        require(_exists(proposalId), "unexistent proposal");
        Proposal storage proposal = _proposals[proposalId];
        require(!proposal.executed, "already executed");
        require(block.timestamp > proposal.end_at, "no live proposal");
        require(_isApproved(proposal), "proposal not approved");

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;
        require(folio.transfer(proposal.receiver, proposal.amount), "token transfer failed");
    }

    function setApprovalPercent(uint256 percent) external onlyOwner {
        require(percent > 0 && percent <= 100, "invalid percent");
        approvalPercent = percent;
    }

    function setFOLIO(address _address) external onlyOwner {
        require(_address != address(0), "invalid address");
        folio = IERC20(_address);
    }

    function setHOC(address _address) external onlyOwner {
        require(_address != address(0), "invalid address");
        hoc = IERC20(_address);
    }

    function setFTO(address _address) external onlyOwner {
        require(_address != address(0), "invalid address");
        fto = IERC20(_address);
    }

    function setCurrentFTO(uint256 _id) external onlyOwner {
        currentFtoId = _id;
    }

    function setProposalAllowedFolioAmount(uint256 amoount) external onlyOwner {
        proposalAllowedFolioAmount = amoount;
    }

    function setProposalAllowedHOCAmount(uint256 amoount) external onlyOwner {
        proposalAllowedHOCAmount = amoount;
    }

    function setProposalAllowedFTOAmount(uint256 amoount) external onlyOwner {
        proposalAllowedFTOAmount = amoount;
    }

    function setVoteAllowedFolioAmount(uint256 amoount) external onlyOwner {
        voteAllowedFolioAmount = amoount;
    }

    function setVoteAllowedHOCAmount(uint256 amoount) external onlyOwner {
        voteAllowedHOCAmount = amoount;
    }

    function setVoteAllowedFTOAmount(uint256 amoount) external onlyOwner {
        voteAllowedFTOAmount = amoount;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    function _tokenBalance(IERC20 token, address account) private view returns (uint256) {
        return token.balanceOf(account);
    }

    function _exists(uint256 proposalId) private view returns (bool) {
        return _owners[proposalId] != address(0);
    }

    function _isLive(Proposal memory proposal) private view returns (bool) {
        return
            !proposal.executed &&
            proposal.status != ProposalStatus.Closed &&
            block.timestamp >= proposal.start_at &&
            block.timestamp <= proposal.end_at;
    }

    function _statusOf(Proposal memory proposal) private view returns (ProposalStatus) {
        if (proposal.executed) {
            return ProposalStatus.Executed;
        }
        if (proposal.status == ProposalStatus.Closed) {
            return ProposalStatus.Closed;
        }
        if (block.timestamp < proposal.start_at) {
            return ProposalStatus.Pending;
        }
        if (block.timestamp <= proposal.end_at) {
            return ProposalStatus.Live;
        }
        return ProposalStatus.Closed;
    }

    function _isApproved(Proposal memory proposal) private view returns (bool) {
        uint256 totalVotes = proposal.votes_yes + proposal.votes_no;
        if (totalVotes == 0) {
            return false;
        }
        return proposal.votes_yes * 100 >= totalVotes * approvalPercent;
    }

    function _mint(address to, uint256 proposalId) private {
        _owners[proposalId] = to;
        _balances[to] += 1;
        _ownedProposals[to].push(proposalId);
        _allProposals.push(proposalId);
        emit Transfer(address(0), to, proposalId);
    }
}
