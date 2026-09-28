// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StudentPayEscrow
 * @author StudentPay Team
 * @notice A peer-to-peer escrow contract for student service agreements.
 *
 * LIFECYCLE V2 (Blinded Proof, Grace Period & Anti-Exploit Timing)
 * ───────────────────────────────────────────────────────────────
 * 1. Create Deal    -> Buyer defines seller, amount, deadline, description.
 * 2. Fund Deal      -> Buyer deposits native token (BOT). Deal is FUNDED.
 * 3. Submit Proof   -> Seller submits a cryptographic commitment (bytes32 hash)
 *                      of work deliverable before deadline. Starts 48h grace period.
 * 4. Grace Period:
 *    a) Buyer Accepts -> Calls releaseFunds(). Funds sent to seller.
 *                        Seller/Buyer can reveal unblinded proof preimage.
 *    b) Buyer Disputes-> Calls openDispute(). Flags deal as DISPUTED.
 *                        Buyer claims refund.
 *    c) Buyer Inactive-> After 48h grace expires, seller calls claimAutoRelease().
 * 5. Expired Deal   -> If seller never submitted proof before deadline,
 *                      grace period is disabled; buyer immediately claims refund.
 *
 * SECURITY PROPERTIES
 * ────────────────────
 * • Non-reentrant on all state-changing transfer functions.
 * • No work-stealing: Deliverable is blinded behind a keccak256 commitment.
 * • Submission deadline rule: Proof submission blocked after deadline.
 * • Auto-release protects sellers against buyer ghosting.
 * • Reentrancy-safe Checks-Effects-Interactions pattern throughout.
 */
contract StudentPayEscrow {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Global post-submission review window for the buyer (48 hours).
    uint256 public constant GRACE_PERIOD = 48 hours;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice The status a deal can be in at any given time.
    enum DealStatus {
        PENDING_FUNDING, // 0 – deal created, waiting for buyer to fund
        FUNDED,          // 1 – buyer locked funds in contract
        WORK_SUBMITTED,  // 2 – seller submitted commitment hash on time
        RELEASED,        // 3 – funds released to seller (accepted or auto-released)
        REFUNDED,        // 4 – refund returned to buyer (expired or disputed)
        CANCELLED,       // 5 – cancelled before funding (by creator)
        DISPUTED         // 6 – buyer flagged deal within grace period
    }

    /// @notice Core data for a single deal.
    struct Deal {
        uint256 id;
        address payable buyer;   // party who pays
        address payable seller;  // party who delivers
        uint256 amount;          // agreed payment amount (in native token)
        uint256 deadline;        // unix timestamp — seller must submit proof before this time
        DealStatus status;
        string description;      // short human-readable description stored on-chain
        uint256 createdAt;
        bytes32 commitmentHash;  // cryptographic commitment of deliverable
        string proofPreimage;    // unblinded deliverable / raw proof (empty until revealed)
        uint256 submittedAt;     // timestamp when seller submitted proof
        uint256 graceEndsAt;     // submittedAt + GRACE_PERIOD
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
        uint256 indexed dealId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 deadline
    );

    event DealFunded(uint256 indexed dealId, address indexed buyer, uint256 amount);

    event ProofSubmitted(
        uint256 indexed dealId,
        address indexed seller,
        bytes32 commitmentHash,
        uint256 submittedAt,
        uint256 graceEndsAt
    );

    event ProofRevealed(uint256 indexed dealId, string proofPreimage);

    event FundsReleased(uint256 indexed dealId, address indexed seller, uint256 amount);

    event AutoReleased(uint256 indexed dealId, address indexed seller, uint256 amount);

    event DisputeOpened(uint256 indexed dealId, address indexed buyer);

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
    error GracePeriodActive(uint256 graceEndsAt, uint256 currentTime);
    error GracePeriodExpired(uint256 graceEndsAt, uint256 currentTime);
    error InvalidDeadline();
    error InvalidAmount();
    error InvalidAddress();
    error InvalidCommitment();
    error CommitmentMismatch(bytes32 expected, bytes32 got);
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
     *
     * @param seller      Address of the service provider (cannot be the caller).
     * @param amount      Payment amount the buyer will lock (in wei).
     * @param deadline    Unix timestamp by which the seller must submit proof.
     * @param description Short description of the agreed work.
     * @return dealId     The unique ID of the newly created deal.
     */
    function createDeal(
        address payable seller,
        uint256 amount,
        uint256 deadline,
        string calldata description
    ) external returns (uint256 dealId) {
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
            createdAt: block.timestamp,
            commitmentHash: bytes32(0),
            proofPreimage: "",
            submittedAt: 0,
            graceEndsAt: 0
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
     * @notice Seller submits a cryptographic commitment (hash) of the deliverable.
     * @dev SUBMISSION DEADLINE RULE:
     *      Must be submitted BEFORE the agreed deadline. If deadline has passed,
     *      submission is rejected, disabling the grace period and allowing
     *      the buyer to immediately refund.
     *
     * @param dealId         The deal ID.
     * @param commitmentHash Keccak256 hash of the deliverable/proof string.
     */
    function submitProof(uint256 dealId, bytes32 commitmentHash)
        external
        dealExists(dealId)
        onlySeller(dealId)
        inStatus(dealId, DealStatus.FUNDED)
    {
        Deal storage deal = deals[dealId];

        if (block.timestamp >= deal.deadline) {
            revert DeadlinePassed(deal.deadline, block.timestamp);
        }
        if (commitmentHash == bytes32(0)) {
            revert InvalidCommitment();
        }

        uint256 submittedAt = block.timestamp;
        uint256 graceEndsAt = submittedAt + GRACE_PERIOD;

        deal.commitmentHash = commitmentHash;
        deal.submittedAt = submittedAt;
        deal.graceEndsAt = graceEndsAt;
        deal.status = DealStatus.WORK_SUBMITTED;

        emit ProofSubmitted(dealId, msg.sender, commitmentHash, submittedAt, graceEndsAt);
    }

    /**
     * @notice Reveal the unblinded raw proof preimage matching the commitment hash.
     * @dev Can be called once work is submitted or released by either participant.
     */
    function revealProof(uint256 dealId, string calldata rawProof)
        external
        dealExists(dealId)
    {
        Deal storage deal = deals[dealId];

        if (deal.status != DealStatus.WORK_SUBMITTED && deal.status != DealStatus.RELEASED) {
            revert InvalidStatus(deal.status, DealStatus.WORK_SUBMITTED);
        }

        bytes32 calculated = keccak256(bytes(rawProof));
        if (calculated != deal.commitmentHash) {
            revert CommitmentMismatch(deal.commitmentHash, calculated);
        }

        deal.proofPreimage = rawProof;

        emit ProofRevealed(dealId, rawProof);
    }

    /**
     * @notice Buyer confirms deliverable and releases funds to the seller.
     * @dev Callable by the buyer when deal is in WORK_SUBMITTED status.
     */
    function releaseFunds(uint256 dealId)
        external
        nonReentrant
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.WORK_SUBMITTED)
    {
        Deal storage deal = deals[dealId];
        uint256 amount = deal.amount;
        address payable sellerAddr = deal.seller;

        deal.status = DealStatus.RELEASED;

        emit FundsReleased(dealId, sellerAddr, amount);

        (bool success,) = sellerAddr.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Buyer confirms deliverable, records the raw proof on-chain, and releases funds.
     */
    function releaseFundsWithProof(uint256 dealId, string calldata rawProof)
        external
        nonReentrant
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.WORK_SUBMITTED)
    {
        Deal storage deal = deals[dealId];
        uint256 amount = deal.amount;
        address payable sellerAddr = deal.seller;

        if (bytes(rawProof).length > 0) {
            bytes32 calculated = keccak256(bytes(rawProof));
            if (calculated != deal.commitmentHash) {
                revert CommitmentMismatch(deal.commitmentHash, calculated);
            }
            deal.proofPreimage = rawProof;
            emit ProofRevealed(dealId, rawProof);
        }

        deal.status = DealStatus.RELEASED;

        emit FundsReleased(dealId, sellerAddr, amount);

        (bool success,) = sellerAddr.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Buyer flags a dispute within the 48-hour grace period if work is unsatisfactory.
     * @dev Stops auto-release and allows the buyer to claim a refund.
     */
    function openDispute(uint256 dealId)
        external
        dealExists(dealId)
        onlyBuyer(dealId)
        inStatus(dealId, DealStatus.WORK_SUBMITTED)
    {
        Deal storage deal = deals[dealId];

        if (block.timestamp > deal.graceEndsAt) {
            revert GracePeriodExpired(deal.graceEndsAt, block.timestamp);
        }

        deal.status = DealStatus.DISPUTED;

        emit DisputeOpened(dealId, msg.sender);
    }

    /**
     * @notice Seller claims payment after the 48-hour grace period expires without buyer dispute.
     * @dev Protects sellers against buyer ghosting.
     */
    function claimAutoRelease(uint256 dealId)
        external
        nonReentrant
        dealExists(dealId)
        onlySeller(dealId)
        inStatus(dealId, DealStatus.WORK_SUBMITTED)
    {
        Deal storage deal = deals[dealId];

        if (block.timestamp <= deal.graceEndsAt) {
            revert GracePeriodActive(deal.graceEndsAt, block.timestamp);
        }

        uint256 amount = deal.amount;
        address payable sellerAddr = deal.seller;

        deal.status = DealStatus.RELEASED;

        emit AutoReleased(dealId, sellerAddr, amount);
        emit FundsReleased(dealId, sellerAddr, amount);

        (bool success,) = sellerAddr.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Buyer claims a refund under either of two valid conditions:
     *         1) Seller failed to submit proof before the deadline (status FUNDED).
     *         2) Deal was disputed within the grace period (status DISPUTED).
     */
    function claimRefund(uint256 dealId)
        external
        nonReentrant
        dealExists(dealId)
        onlyBuyer(dealId)
    {
        Deal storage deal = deals[dealId];
        DealStatus currentStatus = deal.status;

        if (currentStatus == DealStatus.FUNDED) {
            if (block.timestamp < deal.deadline) {
                revert DeadlineNotReached(deal.deadline, block.timestamp);
            }
        } else if (currentStatus != DealStatus.DISPUTED) {
            revert InvalidStatus(currentStatus, DealStatus.DISPUTED);
        }

        uint256 amount = deal.amount;
        address payable buyerAddr = deal.buyer;

        deal.status = DealStatus.REFUNDED;

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
    function getDeal(uint256 dealId)
        external
        view
        dealExists(dealId)
        returns (Deal memory)
    {
        return deals[dealId];
    }

    /**
     * @notice Check whether the 48-hour post-submission review grace period is active.
     */
    function isGracePeriodActive(uint256 dealId)
        external
        view
        dealExists(dealId)
        returns (bool)
    {
        Deal storage deal = deals[dealId];
        return deal.status == DealStatus.WORK_SUBMITTED && block.timestamp <= deal.graceEndsAt;
    }

    /**
     * @notice Returns all deal IDs where the given address is either buyer or seller.
     */
    function getDealsForAddress(address participant)
        external
        view
        returns (uint256[] memory)
    {
        uint256 total = dealCount;
        uint256[] memory temp = new uint256[](total);
        uint256 count = 0;

        for (uint256 i = 1; i <= total; ) {
            Deal storage d = deals[i];
            if (d.buyer == participant || d.seller == participant) {
                temp[count] = i;
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; ) {
            result[j] = temp[j];
            unchecked { ++j; }
        }
        return result;
    }
}
