// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IPoolFactory.sol";

interface IContractRegistry {

    function getAddress(bytes32 name) external view returns (address);

    function requireAndGetAddress(bytes32 name) external view returns (address);

    function poolFactory() external view returns (IPoolFactory);
}
