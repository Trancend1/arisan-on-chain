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
        assertEq(store.get(), 0);
    }

    function test_SetUpdatesValueAndEmits() public {
        vm.expectEmit(true, false, false, true);
        emit ValueChanged(address(this), 42);
        store.set(42);
        assertEq(store.get(), 42);
    }
}
