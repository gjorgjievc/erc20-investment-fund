// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "./interfaces/IBaseContract.sol";
import "./interfaces/IStrategy.sol";

/// @title  AaveStrategyFactory
/// @notice Creates new aave strategies.
contract AaveStrategyFactory is UpgradeableBeacon, IBaseContract {

    /// @notice address of compound strategies per underlying token
    mapping(address => address) public poolStrategies;

    // solhint-disable-next-line
    /// @notice Construct an upgradable beacon
    /// @param  implementation_ address of the beacon proxy
    constructor(address implementation_) UpgradeableBeacon(implementation_) {}


    /// @notice Creates new strategy for underlying token. Only owner.
    /// @param  _underlying Underlying token address
    /// @param  _registry Contract registry
    /// @param  _data call data
    /// @return address strategy address
    function createStrategy(address _underlying, address _registry, bytes calldata _data)
    external onlyOwner returns (address) {

        // Deploy a beacon proxy that gets the implementation address for each call from a UpgradeableBeacon.
        address instance = address(new BeaconProxy(address(this), ""));

        // Check that the contract was created
        require(instance != address(0), "NOT_CREATED");

        // init the strategy
        IStrategy(instance).initialize(_underlying, _registry, msg.sender, _data);

        poolStrategies[_underlying] = instance;

        return instance;
    }

    /// @notice Contract name
    /// @return bytes32 name
    function getName() override external view returns (bytes32) {
        return "AaveStrategyFactory";
    }

}