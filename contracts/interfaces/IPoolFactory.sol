// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface IPoolFactory {

    function poolAddresses(address underlying) external view returns (address pool);

}