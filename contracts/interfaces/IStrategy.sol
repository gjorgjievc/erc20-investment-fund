// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface IStrategy {

    function initialize(
        address _underlying, address _registry, address _owner, bytes memory _data
    ) external;

    function redeem(uint256 _redeemAmount, uint256 _totalSupply, address _account) external returns (uint256);

    function rebalance() external;

    function getAPR() external view returns (uint256);

    function investedUnderlyingBalance() external view returns (uint256);

    function underlying() external view returns (address);
}