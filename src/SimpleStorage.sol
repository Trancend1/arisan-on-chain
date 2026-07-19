// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SimpleStorage — latihan fondasi TR (jangan dihapus)
/// @notice Kontrak minimal: 1 write, 1 read, 1 event. Nama fungsi mengikuti
///         persis template Lembar TR TC789A Langkah 4 (store/retrieve) supaya
///         perintah cast pada Langkah 5 dokumen dosen berfungsi apa adanya.
contract SimpleStorage {
    uint256 private value;

    event ValueChanged(address indexed setter, uint256 newValue);

    function store(uint256 _value) public {
        value = _value;
        emit ValueChanged(msg.sender, _value);
    }

    function retrieve() public view returns (uint256) {
        return value;
    }
}
