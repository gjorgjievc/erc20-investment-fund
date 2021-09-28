// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IContractRegistry.sol";
import "./interfaces/IStrategy.sol";
import "./interfaces/CERC20.sol";

contract StrategyManager is IStrategy, OwnableUpgradeable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    uint256 private constant FULL_ALLOC = 100000000; // 100%

    /// @notice underlying token of the pool
    address public override underlying;

    /// @notice Weighted allocations per pool. The index of the array determines the allocation strategy.
    ///         The value at the index determines the weight assigned to that strategy.
    /// @dev    indexes: 0 - Compound; 1 - Aave; 2 - Yearn
    uint256[] public proposedAllocation;

    /// @notice Executed allocation
    uint256[] public executedAllocation;

    //  @notice Strategy addresses
    /// @dev    0   -   CompoundStrategy; 1  - AaveStrategy; 2  -  YearnStrategy
    address[] public underlyingStrategy;

    /// @notice contract registry
    IContractRegistry public contractRegistry;

    /// @notice Initialize the contract instead of a constructor during deployment.
    /// @param  _underlying Underlying token address
    /// @param  _registry Contract registry address
    //  @param  _owner Contract owner
    /// @param  _data strategy init data
    function initialize(address _underlying, address _registry, address _owner, bytes memory _data)
        external override initializer {

        require(_underlying != address(0) && _owner != address(0)
                && _registry != address(0), "ZERO_ADDRESS");

        OwnableUpgradeable.__Ownable_init();

        (uint256[] memory _allocations, address[] memory _strategies) = abi.decode(
        _data, (uint256[], address[]));

        underlying = _underlying;
        contractRegistry = IContractRegistry(_registry);

        underlyingStrategy = _strategies;
        proposedAllocation = _allocations;

        transferOwnership(_owner);
    }

    /// @dev only controller
    modifier onlyController() {
        require(msg.sender == contractRegistry.poolFactory().poolAddresses(underlying)
            || msg.sender == owner(),
            "NOT_POOL");
        _;
    }

    /// @notice Set a new allocation for the pool. Only owner.
    /// @param  newAllocation array of protocol allocation.
    function setAllocation(uint256[] memory newAllocation) external onlyOwner {
        uint256 total;
        for (uint256 i = 0; i < newAllocation.length; i++) {
            total = total.add(newAllocation[i]);
        }
        require(total == FULL_ALLOC, "NOT_FULL_ALLOCATION");

        proposedAllocation = newAllocation;
    }

    function redeem(uint256 _redeemAmount, uint256 _totalSupply, address _account)
    external override onlyController returns (uint256 redeemedTokens) {

        redeemedTokens = _redeemInternal(_redeemAmount, _totalSupply);
        IERC20(underlying).safeTransfer(_account, redeemedTokens);
    }

    function rebalance() external override onlyController {

        uint256 balance = underlyingBalanceInPool();
        if (balance > 0) {
            _allocateFunds(proposedAllocation, balance);
            executedAllocation = proposedAllocation;
        }
    }

    /// @notice Get the total balance of the underlying token owned by the pool and its strategies.
    /// @return total underlying balance.
    function investedUnderlyingBalance() external override view returns (uint256 total) {
        if (executedAllocation.length == 0) {
            return underlyingBalanceInPool();
        }

        address strategy;
        for (uint256 i = 0; i < executedAllocation.length; i++) {
            strategy = underlyingStrategy[i];
            require(strategy != address(0), "NO_STRATEGY");

            total = total.add(IStrategy(strategy).investedUnderlyingBalance());
        }

        // add pool balance
        total = total.add(underlyingBalanceInPool());
    }

    /// @notice APR for the current protocol toke
    function getAPR() external override view returns (uint256 avgApr) {
        
        uint256 total;
        uint256 allocatedBalance;
        IStrategy strategy;

        for (uint256 i = 0; i < executedAllocation.length; i++) {
            
            strategy = IStrategy(underlyingStrategy[i]);
            allocatedBalance = strategy.investedUnderlyingBalance();

            if (allocatedBalance == 0) {
                continue;
            }
            total = total.add(allocatedBalance);

            avgApr = avgApr.add(strategy.getAPR().mul(allocatedBalance));
        }
        
        if (total > 0) {
            avgApr = avgApr.div(total);
        }
    }

    /// @notice Get the balance of the underlying token owned by the pool itself.
    /// @return uint256 underlying balance.
    function underlyingBalanceInPool() public view returns (uint256) {
        return IERC20(underlying).balanceOf(address(this));
    }

    /// @notice Redeem the given amount from all the available strategies.
    /// @param  _amount to redeem.
    /// @param  _totalSupply of tokens available for redeem.
    /// @return redeemedTokens tokens redeemed.
    function _redeemInternal(uint256 _amount, uint256 _totalSupply) private returns (uint256 redeemedTokens) {

        address strategy;
        for (uint256 i = 0; i < executedAllocation.length; i++) {
            strategy = underlyingStrategy[i];
            require(strategy != address(0), "NO_STRATEGY");
            uint256 strategyBalance = IStrategy(strategy).investedUnderlyingBalance();
            if (strategyBalance > 0) {
                redeemedTokens = redeemedTokens.add(
                    IStrategy(strategy).redeem(_amount, _totalSupply, address(this))
                );
            }
        }
    }

    /// @notice Allocate the underlying funds based on the allocations provided.
    /// @param   _allocations strategy allocations.
    /// @param  _total total to allocate
    function _allocateFunds(uint256[] memory _allocations, uint256 _total) internal {
        uint256[] memory strategyAmounts = _amountsFromAllocations(_allocations, _total);

        uint256 currAmount;
        address strategy;

        // rebalance for each strategy
        for (uint256 i = 0; i < _allocations.length; i++) {
            currAmount = strategyAmounts[i];
            if (currAmount != 0) {
                strategy = underlyingStrategy[i];
                require(strategy != address(0), "NO_STRATEGY");

                // TODO emit allocation event
                IERC20(underlying).safeTransfer(strategy, currAmount);
                IStrategy(strategy).rebalance();
            }
        }
    }

    /// @notice Gets the allocation amounts that correspondent to the strategy allocations.
    /// @param   _allocations strategy allocations.
    /// @param  _total total to allocate
    /// @return newAmounts  amounts that correspondent to the allocation weight.
    function _amountsFromAllocations(uint256[] memory _allocations, uint256 _total)
    internal pure returns (uint256[] memory newAmounts) {
        newAmounts = new uint256[](_allocations.length);
        uint256 currBalance;
        uint256 allocatedBalance;

        for (uint256 i = 0; i < _allocations.length; i++) {
            if (i == _allocations.length - 1) {
                newAmounts[i] = _total.sub(allocatedBalance);
            } else {
                currBalance = _total.mul(_allocations[i]).div(FULL_ALLOC);
                allocatedBalance = allocatedBalance.add(currBalance);
                newAmounts[i] = currBalance;
            }
        }
        return newAmounts;
    }
}