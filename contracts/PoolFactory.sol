// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IPoolFactory.sol";
import "./interfaces/IBaseContract.sol";

/// @title  PoolFactory
/// @notice Creates new pools for underlying tokens.
contract PoolFactory is UpgradeableBeacon, IPoolFactory, IBaseContract {

    mapping(address => address) public override poolAddresses;
    address[] public tokenAddresses;

    event PoolProxyDeployed(address proxy);

    // solhint-disable-next-line
    /// @notice Construct an upgradable beacon.
    /// @param  implementation_ address of the beacon proxy.
    constructor(address implementation_) UpgradeableBeacon(implementation_) {}

    /// @notice Creates new pools for underlying token. Only owner.
    /// @param  poolToken  address of the underlying token to crete pool for.
    /// @return address pool address
    function createPool(address poolToken, address _strategy, uint256 _maxInvestmentPerc)
    external onlyOwner returns (address) {

        // Check if a pool was already created for the given token.
        require(poolAddresses[poolToken] == address(0), "ALREADY_CREATED");

        // Deploy a beacon proxy that gets the implementation address for each call from a UpgradeableBeacon.
        address instance = address(new BeaconProxy(address(this), ""));
        emit PoolProxyDeployed(instance);

        // Check that the contract was created
        require(instance != address(0), "NOT_CREATED");

        // Set pool/token name and symbol
        string memory _name = ERC20(poolToken).name();
        string memory _symbol = "LPT";

        // init the pool; add initial strategies
        IPool(instance).initialize(_name, _symbol, poolToken, _strategy, _maxInvestmentPerc, msg.sender);

        tokenAddresses.push(poolToken);

        // Map created pool with proxy
        poolAddresses[poolToken] = instance;
        return instance;

    }

    /// @notice Pool count
    /// @return uint256 count
    function getTokenAddresses() public view returns (uint256) {
        return tokenAddresses.length;
    }

    /// @notice Contract name
    /// @return bytes32 name
    function getName() override external view returns (bytes32) {
        return "PoolFactory";
    }

    // solhint-disable-next-line
    receive() external payable {}

}
