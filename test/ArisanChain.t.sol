// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArisanChain} from "../src/ArisanChain.sol";

/// Kontrak penyerang untuk test_ReentrancyBlocked: saat menerima pot, mencoba
/// memanggil balik closeRound(). try/catch dipakai agar payout tetap diterima
/// dan kita bisa mengukur bahwa re-entry GAGAL (bukan sekadar tx revert).
contract ReentrantAttacker {
    ArisanChain public target;
    uint256 public reentryAttempts;
    uint256 public reentrySuccesses;

    constructor(ArisanChain _target) {
        target = _target;
    }

    function contribute() external payable {
        target.contribute{value: msg.value}();
    }

    receive() external payable {
        reentryAttempts += 1;
        try target.closeRound() {
            reentrySuccesses += 1;
        } catch {}
    }
}

contract ArisanChainTest is Test {
    uint256 internal constant AMOUNT = 1 ether;

    ArisanChain internal arisan;
    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address[3] internal anggota;

    event MemberAdded(address indexed member);
    event ArisanStarted(uint256 totalRounds, uint256 amount);
    event Contributed(address indexed member, uint256 indexed round, uint256 amount);
    event RoundClosed(uint256 indexed round, address indexed recipient, uint256 payout);
    event ArisanFinished();

    function setUp() public {
        vm.prank(admin);
        arisan = new ArisanChain(AMOUNT);
        anggota = [alice, bob, carol];
        for (uint256 i = 0; i < anggota.length; i++) {
            vm.deal(anggota[i], 10 ether);
        }
    }

    // ------------------------------------------------------------- helpers

    function _addAll() internal {
        vm.startPrank(admin);
        for (uint256 i = 0; i < anggota.length; i++) {
            arisan.addMember(anggota[i]);
        }
        vm.stopPrank();
    }

    function _startActive() internal {
        _addAll();
        vm.prank(admin);
        arisan.start();
    }

    function _fillPot() internal {
        for (uint256 i = 0; i < anggota.length; i++) {
            vm.prank(anggota[i]);
            arisan.contribute{value: AMOUNT}();
        }
    }

    // --------------------------------------------------------------- setup

    function test_ConstructorInitialState() public view {
        assertEq(arisan.admin(), admin);
        assertEq(arisan.contributionAmount(), AMOUNT);
        assertEq(uint256(arisan.state()), uint256(ArisanChain.State.Setup));
    }

    function test_ConstructorRejectsZeroAmount() public {
        vm.expectRevert(bytes("AMOUNT_ZERO"));
        new ArisanChain(0);
    }

    function test_AddMemberRecordsAndEmits() public {
        vm.expectEmit(true, false, false, false);
        emit MemberAdded(alice);
        vm.prank(admin);
        arisan.addMember(alice);
        assertTrue(arisan.isMember(alice));
        assertEq(arisan.getMembers().length, 1);
    }

    function test_AddMemberOnlyAdmin() public {
        vm.expectRevert(bytes("NOT_ADMIN"));
        vm.prank(alice);
        arisan.addMember(bob);
    }

    function test_AddMemberRejectsDuplicate() public {
        vm.startPrank(admin);
        arisan.addMember(alice);
        vm.expectRevert(bytes("ALREADY_MEMBER"));
        arisan.addMember(alice);
        vm.stopPrank();
    }

    // --------------------------------------------------------------- start

    function test_StartRequiresTwoMembers() public {
        vm.startPrank(admin);
        arisan.addMember(alice);
        vm.expectRevert(bytes("NEED_2_MEMBERS"));
        arisan.start();
        vm.stopPrank();
    }

    function test_StartActivatesAndLocksMembers() public {
        _addAll();
        vm.expectEmit(false, false, false, true);
        emit ArisanStarted(3, AMOUNT);
        vm.prank(admin);
        arisan.start();

        assertEq(uint256(arisan.state()), uint256(ArisanChain.State.Active));
        assertEq(arisan.totalRounds(), 3);

        // Daftar terkunci: addMember setelah start harus revert.
        vm.expectRevert(bytes("NOT_SETUP"));
        vm.prank(admin);
        arisan.addMember(makeAddr("late"));
    }

    function test_StartOnlyAdmin() public {
        _addAll();
        vm.expectRevert(bytes("NOT_ADMIN"));
        vm.prank(alice);
        arisan.start();
    }

    // ---------------------------------------------------------- contribute

    function test_ContributeAccumulatesPotAndEmits() public {
        _startActive();
        vm.expectEmit(true, true, false, true);
        emit Contributed(alice, 0, AMOUNT);
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();

        assertEq(arisan.pot(), AMOUNT);
        assertTrue(arisan.hasContributed(0, alice));
        (uint256 paid, uint256 total) = arisan.roundProgress();
        assertEq(paid, 1);
        assertEq(total, 3);
    }

    function test_ContributeRejectsNonMember() public {
        _startActive();
        address outsider = makeAddr("outsider");
        vm.deal(outsider, 10 ether);
        vm.expectRevert(bytes("NOT_MEMBER"));
        vm.prank(outsider);
        arisan.contribute{value: AMOUNT}();
    }

    function test_ContributeRejectsWrongAmount() public {
        _startActive();
        vm.expectRevert(bytes("WRONG_AMOUNT"));
        vm.prank(alice);
        arisan.contribute{value: AMOUNT - 1}();
    }

    function test_ContributeRejectsDoubleContribution() public {
        _startActive();
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();
        vm.expectRevert(bytes("ALREADY_CONTRIBUTED"));
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();
    }

    function test_ContributeRejectsBeforeStart() public {
        _addAll();
        vm.expectRevert(bytes("NOT_ACTIVE"));
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();
    }

    // ---------------------------------------------------------- closeRound

    function test_CloseRoundRejectsWhenPotNotFull() public {
        _startActive();
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();
        vm.expectRevert(bytes("POT_NOT_FULL"));
        arisan.closeRound();
    }

    function test_CloseRoundPaysRecipientInOrder() public {
        _startActive();
        _fillPot();

        uint256 balanceBefore = alice.balance;
        uint256 expectedPayout = AMOUNT * 3;

        vm.expectEmit(true, true, false, true);
        emit RoundClosed(0, alice, expectedPayout);
        arisan.closeRound(); // publik: dipanggil non-admin (test contract)

        assertEq(alice.balance, balanceBefore + expectedPayout);
        assertEq(arisan.pot(), 0);
        assertTrue(arisan.hasReceived(alice));
        assertEq(arisan.currentRound(), 1);
        assertEq(arisan.recipientOf(1), bob);
        // Invariant 4: tidak ada dana tersangkut.
        assertEq(address(arisan).balance, arisan.pot());
    }

    function test_FullCycleFinishesAndEveryoneReceivesOnce() public {
        _startActive();
        for (uint256 round = 0; round < 3; round++) {
            _fillPot();
            arisan.closeRound();
        }

        assertEq(uint256(arisan.state()), uint256(ArisanChain.State.Finished));
        assertEq(arisan.currentRound(), 3);
        for (uint256 i = 0; i < anggota.length; i++) {
            assertTrue(arisan.hasReceived(anggota[i]));
            // Zero-sum: tiap anggota setor 3×AMOUNT dan menerima 3×AMOUNT.
            assertEq(anggota[i].balance, 10 ether);
        }
        assertEq(address(arisan).balance, 0);

        // Setelah Finished, contribute harus revert.
        vm.expectRevert(bytes("NOT_ACTIVE"));
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();
    }

    function test_FinalRoundEmitsArisanFinished() public {
        _startActive();
        _fillPot();
        arisan.closeRound();
        _fillPot();
        arisan.closeRound();
        _fillPot();

        vm.expectEmit(false, false, false, false);
        emit ArisanFinished();
        arisan.closeRound();
    }

    // ------------------------------------------------------------ security

    function test_ReentrancyBlocked() public {
        // Attacker jadi anggota PERTAMA sehingga menerima pot ronde 0.
        ReentrantAttacker attacker = new ReentrantAttacker(arisan);
        vm.deal(address(attacker), 10 ether);

        vm.startPrank(admin);
        arisan.addMember(address(attacker));
        arisan.addMember(alice);
        arisan.addMember(bob);
        arisan.start();
        vm.stopPrank();

        attacker.contribute{value: AMOUNT}();
        vm.prank(alice);
        arisan.contribute{value: AMOUNT}();
        vm.prank(bob);
        arisan.contribute{value: AMOUNT}();

        uint256 expectedPayout = AMOUNT * 3;
        uint256 attackerBefore = address(attacker).balance;

        arisan.closeRound();

        // Serangan tercatat dicoba tapi gagal: payout hanya sekali, state maju normal.
        assertEq(attacker.reentryAttempts(), 1);
        assertEq(attacker.reentrySuccesses(), 0);
        assertEq(address(attacker).balance, attackerBefore + expectedPayout);
        assertEq(arisan.pot(), 0);
        assertEq(arisan.currentRound(), 1);
        assertEq(address(arisan).balance, 0);
    }
}
