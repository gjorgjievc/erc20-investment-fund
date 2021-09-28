// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface IPool {

    function initialize(
        string calldata name, string calldata symbol, address token,
        address strategy, uint256 maxInvestmentPerc, address _owner
    ) external;

    function underlyingStrategy() external view returns (address);

}