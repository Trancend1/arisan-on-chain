// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ArisanChain — arisan (ROSCA) on-chain dengan rotasi deterministik
/// @notice Satu grup, N anggota, setoran tetap per ronde. Penerima ronde ke-r
///         selalu members[r]; urutan dikunci saat start(). Spesifikasi lengkap:
///         docs arisanchain.md (sumber kebenaran ABI, invariant, dan keamanan).
contract ArisanChain {
    enum State {
        Setup,
        Active,
        Finished
    }

    address public admin;
    uint256 public contributionAmount;
    State public state;

    address[] private members;
    mapping(address => bool) public isMember;
    mapping(address => bool) public hasReceived;
    /// ronde => anggota => sudah setor
    mapping(uint256 => mapping(address => bool)) public hasContributed;

    uint256 public currentRound;
    uint256 public totalRounds;
    uint256 public pot;

    event MemberAdded(address indexed member);
    event ArisanStarted(uint256 totalRounds, uint256 amount);
    event Contributed(address indexed member, uint256 indexed round, uint256 amount);
    event RoundClosed(uint256 indexed round, address indexed recipient, uint256 payout);
    event ArisanFinished();

    modifier onlyAdmin() {
        require(msg.sender == admin, "NOT_ADMIN");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "NOT_MEMBER");
        _;
    }

    constructor(uint256 _contributionAmount) {
        require(_contributionAmount > 0, "AMOUNT_ZERO");
        admin = msg.sender;
        contributionAmount = _contributionAmount;
        state = State.Setup;
    }

    // ---------------------------------------------------------------- write

    function addMember(address m) external onlyAdmin {
        require(state == State.Setup, "NOT_SETUP");
        require(m != address(0), "ZERO_ADDRESS");
        require(!isMember[m], "ALREADY_MEMBER");
        members.push(m);
        isMember[m] = true;
        emit MemberAdded(m);
    }

    function start() external onlyAdmin {
        require(state == State.Setup, "NOT_SETUP");
        require(members.length >= 2, "NEED_2_MEMBERS");
        totalRounds = members.length;
        state = State.Active;
        emit ArisanStarted(totalRounds, contributionAmount);
    }

    function contribute() external payable onlyMember {
        require(state == State.Active, "NOT_ACTIVE");
        require(msg.value == contributionAmount, "WRONG_AMOUNT");
        require(!hasContributed[currentRound][msg.sender], "ALREADY_CONTRIBUTED");
        hasContributed[currentRound][msg.sender] = true;
        pot += msg.value;
        emit Contributed(msg.sender, currentRound, msg.value);
    }

    /// @notice Sengaja publik (bukan onlyAdmin): penerima & jumlah 100% ditentukan
    ///         kontrak (members[currentRound]), jadi siapa pun aman memicu payout.
    function closeRound() external {
        require(state == State.Active, "NOT_ACTIVE");
        require(pot == contributionAmount * members.length, "POT_NOT_FULL");

        // Checks-Effects-Interactions: seluruh state berubah SEBELUM external call,
        // sehingga re-entry menabrak require(pot == ...) dan revert.
        address recipient = members[currentRound];
        uint256 payout = pot;
        pot = 0;
        hasReceived[recipient] = true;
        uint256 closedRound = currentRound;
        currentRound += 1;

        emit RoundClosed(closedRound, recipient, payout);
        if (currentRound == totalRounds) {
            state = State.Finished;
            emit ArisanFinished();
        }

        (bool ok,) = recipient.call{value: payout}("");
        require(ok, "TRANSFER_FAILED");
    }

    // ----------------------------------------------------------------- read

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function recipientOf(uint256 round) external view returns (address) {
        require(round < members.length, "ROUND_OUT_OF_RANGE");
        return members[round];
    }

    /// @return paid  jumlah anggota yang sudah setor ronde berjalan
    /// @return total jumlah seluruh anggota
    function roundProgress() external view returns (uint256 paid, uint256 total) {
        total = members.length;
        for (uint256 i = 0; i < total; i++) {
            if (hasContributed[currentRound][members[i]]) {
                paid += 1;
            }
        }
    }
}
