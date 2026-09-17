// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StudentPayEscrow} from "../src/StudentPayEscrow.sol";

/**
 * @title DeployStudentPayEscrow
 * @notice Foundry deployment script for StudentPayEscrow.
 *
 * Usage:
 *   # Dry-run (no broadcast)
 *   forge script script/DeployStudentPayEscrow.s.sol --rpc-url bohr_testnet
 *
 *   # Live broadcast (requires PRIVATE_KEY in environment)
 *   forge script script/DeployStudentPayEscrow.s.sol \
 *     --rpc-url bohr_testnet \
 *     --broadcast \
 *     --verify
 *
 * Environment variables required for live broadcast:
 *   PRIVATE_KEY  — deployer private key (NEVER commit this)
 *   BOHR_RPC_URL — set in foundry.toml [rpc_endpoints]
 */
contract DeployStudentPayEscrow is Script {
    function run() external returns (StudentPayEscrow escrow) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        escrow = new StudentPayEscrow();

        vm.stopBroadcast();

        console.log("StudentPayEscrow deployed at:", address(escrow));
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
    }
}

