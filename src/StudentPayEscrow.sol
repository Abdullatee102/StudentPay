// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StudentPayEscrow
 * @author StudentPay Team
 * @notice A peer-to-peer escrow contract for student service agreements.
 *
 * LIFECYCLE
 * ─────────
 * Create Deal  →  Fund Deal  →  Work Completed  →  Release Funds
 *                          ↘  Deadline Expires  →  Claim Refund
 *
 * SECURITY PROPERTIES
 * ────────────────────
 * • Non-reentrant on all state-changing functions (manual guard).
 * • Only deal participants can advance their own deal's state.
 * • Funds are held by the contract; neither party can unilaterally withdraw
 *   without satisfying the lifecycle condition.
 * • No admin key / owner who can drain funds.
 */
contract StudentPayEscrow {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice The status a deal can be in at any given time.
    enum DealStatus {
        PENDING_FUNDING, // 0 – deal created, waiting for buyer to fund
        FUNDED, // 1 – buyer has locked funds in contract
        COMPLETED, // 2 – seller has marked work as complete
        RELEASED, // 3 – buyer confirmed, funds sent to seller
        REFUNDED, // 4 – refund returned to buyer
        CANCELLED // 5 – cancelled before funding (by creator)
    }

    /// @notice Core data for a single deal.
    struct Deal {
        uint256 id;
        address payable buyer; // party who pays
        address payable seller; // party who delivers
        uint256 amount; // agreed payment amount (in native token)
        uint256 deadline; // unix timestamp — seller must complete by this time
        DealStatus status;
        string description; // short human-readable description stored on-chain
        string workSubmission; // seller's proof or link for the completed work
        uint256 createdAt;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public dealCount;
    mapping(uint256 => Deal) public deals;

    /// @dev Reentrancy guard — 1 = not entered, 2 = entered.
    uint256 private _status;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event DealCreated(
        uint256 indexed dealId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline
    );

    event DealFunded(uint256 indexed dealId, address indexed buyer, uint256 amount);
    event WorkSubmitted(uint256 indexed dealId, address indexed seller, string submission);
    event WorkCompleted(uint256 indexed dealId, address indexed seller);
    event FundsReleased(uint256 indexed dealId, address indexed seller, uint256 amount);
    event RefundClaimed(uint256 indexed dealId, address indexed buyer, uint256 amount);
    event DealCancelled(uint256 indexed dealId, address indexed cancelledBy);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error DealNotFound(uint256 dealId);
    error Unauthorised();
    error InvalidStatus(DealStatus current, DealStatus required);
    error IncorrectPaymentAmount(uint256 sent, uint256 required);
    error DeadlineNotReached(uint256 deadline, uint256 currentTime);
    error DeadlinePassed(uint256 deadline, uint256 currentTime);
    error InvalidDeadline();
    error InvalidAmount();
    error InvalidAddress();
    error EmptySubmission();
    error ReentrantCall();
    error TransferFailed();

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier nonReentrant() {
        if (_status == 2) revert ReentrantCall();
        _status = 2;
        _;
        _status = 1;
    }

    modifier dealExists(uint256 dealId) {
        if (dealId == 0 || dealId > dealCount) revert DealNotFound(dealId);
        _;
    }

    modifier onlyBuyer(uint256 dealId) {
        if (msg.sender != deals[dealId].buyer) revert Unauthorised();
        _;
    }

    modifier onlySeller(uint256 dealId) {
        if (msg.sender != deals[dealId].seller) revert Unauthorised();
        _;
    }

    modifier inStatus(uint256 dealId, DealStatus required) {
        DealStatus current = deals[dealId].status;
        if (current != required) revert InvalidStatus(current, required);
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        _status = 1; // initialise reentrancy guard
    }

    // ─────────────────────────────────────────────────────────────────────────
    // External functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new escrow deal.
     * @dev The caller becomes the BUYER. The deal starts in PENDING_FUNDING state.
     *      Funding is done in a separate transaction so the buyer can review the
     *      deal on-chain before committing funds.
     *
     * @param seller      Address of the service provider (cannot be the caller).
     * @param amount      Payment amount the buyer will lock (in wei).
     * @param deadline    Unix timestamp by which the seller must mark work complete.
     * @param description Short description of the agreed work (stored on-chain).
     * @return dealId     The unique ID of the newly created deal.
     */
    function createDeal(address payable seller, uint256 amount, uint256 deadline, string calldata description)
        external
        returns (uint256 dealId)
    {
        if (seller == address(0) || seller == msg.sender) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        unchecked {
            dealId = ++dealCount;
        }

        deals[dealId] = Deal({
            id: dealId,
            buyer: payable(msg.sender),
            seller: seller,
            amount: amount,
            deadline: deadline,
            status: DealStatus.PENDING_FUNDING,
            description: description,
            workSubmission: "",
            createdAt: block.timestamp
        });

        emit DealCreated(dealId, msg.sender, seller, amount, deadline);
    }

    /**
     * @notice Fund a deal by sending the exact agreed amount in native token.
     * @dev Only the buyer may fund. The deal must still be PENDING_FUNDING.
     *      The deadline must not have passed at the time of funding.
     */
    function fundDeal(uint256 dealId)
        external
        payable
        nonReentrant
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.PENDING_FUNDING)
    {
        Deal storage deal = deals[dealId];

        if (block.timestamp >= deal.deadline) {
            revert DeadlinePassed(deal.deadline, block.timestamp);
        }
        if (msg.value != deal.amount) {
            revert IncorrectPaymentAmount(msg.value, deal.amount);
        }

        deal.status = DealStatus.FUNDED;

        emit DealFunded(dealId, msg.sender, msg.value);
    }

    /**
     * @notice Submit proof or a link to the completed work.
     * @dev Only the seller may submit while the deal is funded and before its deadline.
     */
    function submitWork(uint256 dealId, string calldata submission)
        external
        dealExists(dealId)
        onlySeller(dealId)
        inStatus(dealId, DealStatus.FUNDED)
    {
        if (bytes(submission).length == 0) revert EmptySubmission();
        if (block.timestamp >= deals[dealId].deadline) {
            revert DeadlinePassed(deals[dealId].deadline, block.timestamp);
        }

        deals[dealId].workSubmission = submission;
        emit WorkSubmitted(dealId, msg.sender, submission);
    }

    /**
     * @notice Buyer confirms that the seller's work is complete.
     * @dev Only callable by the buyer once the deal is in FUNDED state.
     *      This does NOT release funds — the buyer must still release them.
     */
    function markWorkCompleted(uint256 dealId)
        external
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.FUNDED)
    {
        Deal storage deal = deals[dealId];
        if (bytes(deal.workSubmission).length == 0) revert EmptySubmission();

        deal.status = DealStatus.COMPLETED;
        emit WorkCompleted(dealId, msg.sender);
    }

    /**
     * @notice Buyer confirms work and releases funds to the seller.
     * @dev Only callable by the buyer when the deal is in COMPLETED state.
     */
    function releaseFunds(uint256 dealId)
        external
        nonReentrant
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.COMPLETED)
    {
        Deal storage deal = deals[dealId];
        uint256 amount = deal.amount;
        address payable sellerAddr = deal.seller;

        deal.status = DealStatus.RELEASED;

        // Emit before external call to avoid reentrancy-events lint warning.
        // State is already updated above, so CEI pattern is preserved.
        emit FundsReleased(dealId, sellerAddr, amount);

        (bool success,) = sellerAddr.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Buyer claims a refund after the deadline has passed without the
     *         seller marking work as complete.
     * @dev Only callable when the deal is FUNDED and the deadline has expired.
     *      The buyer cannot claim a refund if the seller already marked completion.
     */
    function claimRefund(uint256 dealId)
        external
        nonReentrant
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.FUNDED)
    {
        Deal storage deal = deals[dealId];

        if (block.timestamp < deal.deadline) {
            revert DeadlineNotReached(deal.deadline, block.timestamp);
        }

        uint256 amount = deal.amount;
        address payable buyerAddr = deal.buyer;

        deal.status = DealStatus.REFUNDED;

        // Emit before external call (CEI pattern maintained — state updated above).
        emit RefundClaimed(dealId, buyerAddr, amount);

        (bool success,) = buyerAddr.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Cancel a deal that has not yet been funded.
     * @dev Only the buyer (deal creator) can cancel a PENDING_FUNDING deal.
     */
    function cancelDeal(uint256 dealId)
        external
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.PENDING_FUNDING)
    {
        deals[dealId].status = DealStatus.CANCELLED;
        emit DealCancelled(dealId, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Retrieve full deal details.
     */
    function getDeal(uint256 dealId) external view dealExists(dealId) returns (Deal memory) {
        return deals[dealId];
    }

    /**
     * @notice Returns all deal IDs where the given address is either buyer or seller.
     * @dev O(n) — acceptable for a student-scale app; optimise with indexing if needed.
     */
    function getDealsForAddress(address participant) external view returns (uint256[] memory) {
        uint256 total = dealCount;
        uint256[] memory temp = new uint256[](total);
        uint256 count = 0;

        for (uint256 i = 1; i <= total;) {
            Deal storage d = deals[i];
            if (d.buyer == participant || d.seller == participant) {
                temp[count] = i;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count;) {
            result[j] = temp[j];
            unchecked {
                ++j;
            }
        }
        return result;
    }
}
