// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {StudentPayEscrow} from "../src/StudentPayEscrow.sol";

contract StudentPayEscrowTest is Test {
    StudentPayEscrow public escrow;

    address payable public buyer  = payable(makeAddr("buyer"));
    address payable public seller = payable(makeAddr("seller"));
    address payable public third  = payable(makeAddr("third"));

    uint256 public constant DEAL_AMOUNT = 1 ether;
    uint256 public constant ONE_DAY     = 1 days;
    uint256 public constant GRACE       = 48 hours;

    string public constant RAW_PROOF = "https://ipfs.io/ipfs/QmDeliverable12345";
    bytes32 public PROOF_HASH;

    function setUp() public {
        escrow = new StudentPayEscrow();
        vm.deal(buyer, 10 ether);
        vm.deal(seller, 1 ether);
        vm.deal(third, 2 ether);
        PROOF_HASH = keccak256(bytes(RAW_PROOF));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _createDeal() internal returns (uint256 dealId) {
        vm.prank(buyer);
        dealId = escrow.createDeal(
            seller,
            DEAL_AMOUNT,
            block.timestamp + ONE_DAY,
            "Build a responsive landing page"
        );
    }

    function _createAndFundDeal() internal returns (uint256 dealId) {
        dealId = _createDeal();
        vm.prank(buyer);
        escrow.fundDeal{value: DEAL_AMOUNT}(dealId);
    }

    function _createFundAndSubmit() internal returns (uint256 dealId) {
        dealId = _createAndFundDeal();
        vm.prank(seller);
        escrow.submitProof(dealId, PROOF_HASH);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createDeal & fundDeal
    // ─────────────────────────────────────────────────────────────────────────

    function test_createDeal_succeeds() public {
        uint256 id = _createDeal();
        assertEq(id, 1);
        assertEq(escrow.dealCount(), 1);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(d.buyer, buyer);
        assertEq(d.seller, seller);
        assertEq(d.amount, DEAL_AMOUNT);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.PENDING_FUNDING));
    }

    function test_fundDeal_succeeds() public {
        uint256 id = _createDeal();
        uint256 balBefore = address(escrow).balance;

        vm.prank(buyer);
        escrow.fundDeal{value: DEAL_AMOUNT}(id);

        assertEq(address(escrow).balance, balBefore + DEAL_AMOUNT);
        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.FUNDED));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // submitProof & Submission Deadline Gate
    // ─────────────────────────────────────────────────────────────────────────

    function test_submitProof_succeedsBeforeDeadline() public {
        uint256 id = _createAndFundDeal();

        vm.prank(seller);
        escrow.submitProof(id, PROOF_HASH);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.WORK_SUBMITTED));
        assertEq(d.commitmentHash, PROOF_HASH);
        assertEq(d.submittedAt, block.timestamp);
        assertEq(d.graceEndsAt, block.timestamp + GRACE);
        assertTrue(escrow.isGracePeriodActive(id));
    }

    function test_submitProof_revertsIfDeadlinePassed() public {
        uint256 id = _createAndFundDeal();

        // Warp past deadline
        vm.warp(block.timestamp + ONE_DAY + 1);

        // Seller tries to submit late -> REVERTS
        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                StudentPayEscrow.DeadlinePassed.selector,
                block.timestamp - 1, // original deadline was warped past
                block.timestamp
            )
        );
        escrow.submitProof(id, PROOF_HASH);
    }

    function test_submitProof_revertsIfNotSeller() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        vm.expectRevert(StudentPayEscrow.Unauthorised.selector);
        escrow.submitProof(id, PROOF_HASH);
    }

    function test_submitProof_revertsIfZeroHash() public {
        uint256 id = _createAndFundDeal();

        vm.prank(seller);
        vm.expectRevert(StudentPayEscrow.InvalidCommitment.selector);
        escrow.submitProof(id, bytes32(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Grace Period, Accept & Release
    // ─────────────────────────────────────────────────────────────────────────

    function test_releaseFunds_buyerAcceptsInstantly() public {
        uint256 id = _createFundAndSubmit();

        uint256 sellerBalBefore = seller.balance;

        vm.prank(buyer);
        escrow.releaseFunds(id);

        assertEq(seller.balance, sellerBalBefore + DEAL_AMOUNT);
        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.RELEASED));
    }

    function test_releaseFundsWithProof_validPreimage() public {
        uint256 id = _createFundAndSubmit();

        vm.prank(buyer);
        escrow.releaseFundsWithProof(id, RAW_PROOF);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.RELEASED));
        assertEq(d.proofPreimage, RAW_PROOF);
    }

    function test_releaseFundsWithProof_revertsOnMismatch() public {
        uint256 id = _createFundAndSubmit();

        vm.prank(buyer);
        vm.expectRevert();
        escrow.releaseFundsWithProof(id, "wrong_proof_data");
    }

    function test_revealProof_bySellerAfterRelease() public {
        uint256 id = _createFundAndSubmit();

        vm.prank(buyer);
        escrow.releaseFunds(id);

        vm.prank(seller);
        escrow.revealProof(id, RAW_PROOF);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(d.proofPreimage, RAW_PROOF);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Dispute Workflow (Buyer-favoured within 48h)
    // ─────────────────────────────────────────────────────────────────────────

    function test_openDispute_withinGracePeriod() public {
        uint256 id = _createFundAndSubmit();

        // Warp 24 hours into grace period (halfway)
        vm.warp(block.timestamp + 24 hours);

        vm.prank(buyer);
        escrow.openDispute(id);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.DISPUTED));
        assertFalse(escrow.isGracePeriodActive(id));
    }

    function test_openDispute_revertsAfterGracePeriod() public {
        uint256 id = _createFundAndSubmit();

        // Warp 49 hours (past 48h grace)
        vm.warp(block.timestamp + 49 hours);

        vm.prank(buyer);
        vm.expectRevert();
        escrow.openDispute(id);
    }

    function test_disputeRefund_buyerGetsFullRefund() public {
        uint256 id = _createFundAndSubmit();

        // Dispute within grace window
        vm.warp(block.timestamp + 12 hours);
        vm.prank(buyer);
        escrow.openDispute(id);

        uint256 buyerBalBefore = buyer.balance;

        // Buyer claims refund from DISPUTED state
        vm.prank(buyer);
        escrow.claimRefund(id);

        assertEq(buyer.balance, buyerBalBefore + DEAL_AMOUNT);
        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.REFUNDED));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-Release Fallback (Protects against Buyer Ghosting)
    // ─────────────────────────────────────────────────────────────────────────

    function test_claimAutoRelease_revertsDuringGracePeriod() public {
        uint256 id = _createFundAndSubmit();

        // Still in grace window
        vm.warp(block.timestamp + 47 hours);

        vm.prank(seller);
        vm.expectRevert();
        escrow.claimAutoRelease(id);
    }

    function test_claimAutoRelease_succeedsAfterGracePeriod() public {
        uint256 id = _createFundAndSubmit();

        // Advance 48 hours + 1 second
        vm.warp(block.timestamp + 48 hours + 1);

        uint256 sellerBalBefore = seller.balance;

        vm.prank(seller);
        escrow.claimAutoRelease(id);

        assertEq(seller.balance, sellerBalBefore + DEAL_AMOUNT);
        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.RELEASED));
    }

    function test_claimAutoRelease_revertsIfDisputed() public {
        uint256 id = _createFundAndSubmit();

        // Buyer disputes during grace period
        vm.warp(block.timestamp + 10 hours);
        vm.prank(buyer);
        escrow.openDispute(id);

        // Advance past grace period
        vm.warp(block.timestamp + 40 hours);

        // Seller cannot auto-release because deal is DISPUTED
        vm.prank(seller);
        vm.expectRevert();
        escrow.claimAutoRelease(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deadline Expiration without Submission (Grace period disabled)
    // ─────────────────────────────────────────────────────────────────────────

    function test_claimRefund_immediateIfSellerMissedDeadline() public {
        uint256 id = _createAndFundDeal();

        // Seller submits NOTHING. Deadline passes:
        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 buyerBalBefore = buyer.balance;

        vm.prank(buyer);
        escrow.claimRefund(id);

        assertEq(buyer.balance, buyerBalBefore + DEAL_AMOUNT);
        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.REFUNDED));
    }

    function test_claimRefund_revertsIfWorkSubmittedOnTime() public {
        uint256 id = _createFundAndSubmit();

        // Deadline passes, but seller submitted on time!
        vm.warp(block.timestamp + ONE_DAY + 1);

        // Buyer CANNOT claim deadline refund because status is WORK_SUBMITTED
        vm.prank(buyer);
        vm.expectRevert();
        escrow.claimRefund(id);
    }

    function test_claimRefund_revertsBeforeDeadlineIfFunded() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        vm.expectRevert();
        escrow.claimRefund(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // cancelDeal
    // ─────────────────────────────────────────────────────────────────────────

    function test_cancelDeal_succeedsUnfunded() public {
        uint256 id = _createDeal();

        vm.prank(buyer);
        escrow.cancelDeal(id);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.CANCELLED));
    }

    function test_cancelDeal_revertsIfFunded() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        vm.expectRevert();
        escrow.cancelDeal(id);
    }
}
