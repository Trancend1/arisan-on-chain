// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ArisanChain} from "../src/ArisanChain.sol";

/// Deploy reproducible ke Anvil: deploy + addMember x5 + start() dalam satu
/// broadcast, sesuai ARCHITECTURE.md §6. Jalankan:
///   forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
contract DeployScript is Script {
    /// Setoran per ronde untuk demo.
    uint256 internal constant CONTRIBUTION = 1 ether;

    /// Private key akun Anvil #0 (deployer/admin). HANYA untuk lab lokal —
    /// key deterministik Anvil memang publik. Bisa dioverride via env PRIVATE_KEY.
    uint256 internal constant ANVIL_PK0 =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        // Akun Anvil #1..#5 sebagai anggota (urutan = urutan giliran).
        address[5] memory members = [
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8, // anvil #1
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, // anvil #2
            0x90F79bf6EB2c4f870365E785982E1f101E93b906, // anvil #3
            0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65, // anvil #4
            0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc  // anvil #5
        ];

        uint256 pk = vm.envOr("PRIVATE_KEY", ANVIL_PK0);
        vm.startBroadcast(pk);

        ArisanChain arisan = new ArisanChain(CONTRIBUTION);
        for (uint256 i = 0; i < members.length; i++) {
            arisan.addMember(members[i]);
        }
        arisan.start();

        vm.stopBroadcast();

        console.log("ArisanChain deployed at:", address(arisan));
        console.log("contributionAmount (wei):", CONTRIBUTION);
        console.log("totalRounds:", arisan.totalRounds());
    }
}
