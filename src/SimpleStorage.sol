// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SimpleStorage — latihan fondasi TR (jangan dihapus)
/// @notice Kontrak minimal: 1 write, 1 read, 1 event.
contract SimpleStorage {
    uint256 private value;

    event ValueChanged(address indexed setter, uint256 newValue);

    function set(uint256 newValue) external {
        value = newValue;
        emit ValueChanged(msg.sender, newValue);
    }

    function get() external view returns (uint256) {
        return value;
    }
}
