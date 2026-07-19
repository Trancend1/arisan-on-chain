// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SimpleStorage} from "../src/SimpleStorage.sol";

contract SimpleStorageTest is Test {
    SimpleStorage internal store;

    event ValueChanged(address indexed setter, uint256 newValue);

    function setUp() public {
        store = new SimpleStorage();
    }

    function test_InitialValueIsZero() public view {
        assertEq(store.retrieve(), 0);
    }

    function test_StoreUpdatesValueAndEmits() public {
        vm.expectEmit(true, false, false, true);
        emit ValueChanged(address(this), 42);
        store.store(42);
        assertEq(store.retrieve(), 42);
    }
}
