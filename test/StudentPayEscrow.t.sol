// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {StudentPayEscrow} from "../src/StudentPayEscrow.sol";

contract StudentPayEscrowTest is Test {
    StudentPayEscrow public escrow;

    address payable public buyer = payable(makeAddr("buyer"));
    address payable public seller = payable(makeAddr("seller"));
    address payable public third = payable(makeAddr("third"));

    uint256 public constant DEAL_AMOUNT = 1 ether;
    uint256 public constant ONE_DAY = 1 days;

    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        escrow = new StudentPayEscrow();
        vm.deal(buyer, 10 ether);
        vm.deal(seller, 1 ether);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _createDeal() internal returns (uint256 dealId) {
        vm.prank(buyer);
        dealId = escrow.createDeal(seller, DEAL_AMOUNT, block.timestamp + ONE_DAY, "Design a student website");
    }

    function _createAndFundDeal() internal returns (uint256 dealId) {
        dealId = _createDeal();
        vm.prank(buyer);
        escrow.fundDeal{value: DEAL_AMOUNT}(dealId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createDeal
    // ─────────────────────────────────────────────────────────────────────────

    function test_createDeal_succeeds() public {
        vm.prank(buyer);
        uint256 id = escrow.createDeal(seller, DEAL_AMOUNT, block.timestamp + ONE_DAY, "Test deal");

        assertEq(id, 1);
        assertEq(escrow.dealCount(), 1);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(d.buyer, buyer);
        assertEq(d.seller, seller);
        assertEq(d.amount, DEAL_AMOUNT);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.PENDING_FUNDING));
    }

    function test_createDeal_emitsEvent() public {
        vm.prank(buyer);
        vm.expectEmit(true, true, true, true);
        emit StudentPayEscrow.DealCreated(1, buyer, seller, DEAL_AMOUNT, block.timestamp + ONE_DAY);
        escrow.createDeal(seller, DEAL_AMOUNT, block.timestamp + ONE_DAY, "Test deal");
    }

    function test_createDeal_revertsIfSellerIsZero() public {
        vm.prank(buyer);
        vm.expectRevert(StudentPayEscrow.InvalidAddress.selector);
        escrow.createDeal(payable(address(0)), DEAL_AMOUNT, block.timestamp + ONE_DAY, "");
    }

    function test_createDeal_revertsIfSellerIsBuyer() public {
        vm.prank(buyer);
        vm.expectRevert(StudentPayEscrow.InvalidAddress.selector);
        escrow.createDeal(buyer, DEAL_AMOUNT, block.timestamp + ONE_DAY, "");
    }

    function test_createDeal_revertsIfAmountIsZero() public {
        vm.prank(buyer);
        vm.expectRevert(StudentPayEscrow.InvalidAmount.selector);
        escrow.createDeal(seller, 0, block.timestamp + ONE_DAY, "");
    }

    function test_createDeal_revertsIfDeadlineInPast() public {
        vm.prank(buyer);
        vm.expectRevert(StudentPayEscrow.InvalidDeadline.selector);
        escrow.createDeal(seller, DEAL_AMOUNT, block.timestamp, "");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // fundDeal
    // ─────────────────────────────────────────────────────────────────────────

    function test_fundDeal_succeeds() public {
        uint256 id = _createDeal();
        uint256 contractBalanceBefore = address(escrow).balance;

        vm.prank(buyer);
        escrow.fundDeal{value: DEAL_AMOUNT}(id);

        assertEq(address(escrow).balance, contractBalanceBefore + DEAL_AMOUNT);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.FUNDED));
    }

    function test_fundDeal_revertsIfWrongAmount() public {
        uint256 id = _createDeal();
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(StudentPayEscrow.IncorrectPaymentAmount.selector, 0.5 ether, DEAL_AMOUNT)
        );
        escrow.fundDeal{value: 0.5 ether}(id);
    }

    function test_fundDeal_revertsIfNotBuyer() public {
        uint256 id = _createDeal();
        vm.deal(third, 2 ether);
        vm.prank(third);
        vm.expectRevert(StudentPayEscrow.Unauthorised.selector);
        escrow.fundDeal{value: DEAL_AMOUNT}(id);
    }

    function test_fundDeal_revertsAfterDeadline() public {
        uint256 id = _createDeal();
        vm.warp(block.timestamp + ONE_DAY + 1);
        vm.prank(buyer);
        vm.expectRevert();
        escrow.fundDeal{value: DEAL_AMOUNT}(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // markWorkCompleted
    // ─────────────────────────────────────────────────────────────────────────

    function test_markWorkCompleted_succeeds() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        escrow.markWorkCompleted(id);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.COMPLETED));
    }

    function test_markWorkCompleted_revertsIfNotBuyer() public {
        uint256 id = _createAndFundDeal();
        vm.prank(seller);
        vm.expectRevert(StudentPayEscrow.Unauthorised.selector);
        escrow.markWorkCompleted(id);
    }

    function test_markWorkCompleted_revertsIfNotFunded() public {
        uint256 id = _createDeal(); // still PENDING_FUNDING
        vm.prank(buyer);
        vm.expectRevert();
        escrow.markWorkCompleted(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // releaseFunds
    // ─────────────────────────────────────────────────────────────────────────

    function test_releaseFunds_succeeds() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        escrow.markWorkCompleted(id);

        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        escrow.releaseFunds(id);

        assertEq(seller.balance, sellerBalanceBefore + DEAL_AMOUNT);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.RELEASED));
    }

    function test_releaseFunds_revertsIfNotBuyer() public {
        uint256 id = _createAndFundDeal();
        vm.prank(buyer);
        escrow.markWorkCompleted(id);

        vm.prank(seller);
        vm.expectRevert(StudentPayEscrow.Unauthorised.selector);
        escrow.releaseFunds(id);
    }

    function test_releaseFunds_revertsIfNotCompleted() public {
        uint256 id = _createAndFundDeal(); // status = FUNDED, not COMPLETED
        vm.prank(buyer);
        vm.expectRevert();
        escrow.releaseFunds(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // claimRefund
    // ─────────────────────────────────────────────────────────────────────────

    function test_claimRefund_succeedsAfterDeadline() public {
        uint256 id = _createAndFundDeal();

        // advance past the deadline
        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        escrow.claimRefund(id);

        assertEq(buyer.balance, buyerBalanceBefore + DEAL_AMOUNT);

        StudentPayEscrow.Deal memory d = escrow.getDeal(id);
        assertEq(uint8(d.status), uint8(StudentPayEscrow.DealStatus.REFUNDED));
    }

    function test_claimRefund_revertsBeforeDeadline() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        vm.expectRevert();
        escrow.claimRefund(id);
    }

    function test_claimRefund_revertsIfBuyerMarkedComplete() public {
        uint256 id = _createAndFundDeal();

        vm.prank(buyer);
        escrow.markWorkCompleted(id);

        vm.warp(block.timestamp + ONE_DAY + 1);

        vm.prank(buyer);
        vm.expectRevert(); // status is COMPLETED, not FUNDED
        escrow.claimRefund(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // cancelDeal
    // ─────────────────────────────────────────────────────────────────────────

    function test_cancelDeal_succeeds() public {
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

    // ─────────────────────────────────────────────────────────────────────────
    // getDealsForAddress
    // ─────────────────────────────────────────────────────────────────────────

    function test_getDealsForAddress_returnsBuyerDeals() public {
        uint256 id1 = _createDeal();
        uint256 id2 = _createDeal();

        uint256[] memory ids = escrow.getDealsForAddress(buyer);

        assertEq(ids.length, 2);
        assertEq(ids[0], id1);
        assertEq(ids[1], id2);
    }

    function test_getDealsForAddress_returnsSellerDeals() public {
        _createDeal();

        uint256[] memory ids = escrow.getDealsForAddress(seller);
        assertEq(ids.length, 1);
    }

    function test_getDealsForAddress_returnsEmptyForUnrelated() public {
        _createDeal();
        uint256[] memory ids = escrow.getDealsForAddress(third);
        assertEq(ids.length, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getDeal — invalid id
    // ─────────────────────────────────────────────────────────────────────────

    function test_getDeal_revertsOnInvalidId() public {
        vm.expectRevert(abi.encodeWithSelector(StudentPayEscrow.DealNotFound.selector, 99));
        escrow.getDeal(99);
    }
}

