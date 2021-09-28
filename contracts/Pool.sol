// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IStrategy.sol";

/// @title  Pool
/// @notice Liquidity pool for for depositing tokens. For every token deposited
///         into the pool, a LP token token is minted, representing a share of the pool.
///         LP tokens can be redeemed for the underlying tokens.
/// @dev    needs to be upgradeable, so that it complies with the beacon proxy pattern.
contract Pool is ERC20Upgradeable, IPool, OwnableUpgradeable {

    using SafeMath for uint256;
    using SafeERC20 for ERC20;
    uint256 public constant DEFAULT_LPT_RATE = 1000;
    uint256 private constant FULL_ALLOC = 100000000;

    /// @notice when LP amount was redeemed
    event Redeemed(address indexed beneficiary, uint256 amount);

    /// @notice when LP amount was minted as a result of a deposit
    event Deposited(address indexed beneficiary, uint256 amount);

    /// @notice underlying token of the pool
    ERC20 public underlying;

    /// @notice underlying token decimal
    uint256 public underlyingUnit;

    //  @notice Strategy address
    address public override underlyingStrategy;

    // Max assets percentage to be invested. The rest is kept in the pool as reserve
    uint256 public maxInvestmentPerc; // 100000 == 100% -> 1000

    /// @notice Initialize the contract instead of a constructor during deployment.
    /// @param  _name name of the LP token
    /// @param  _symbol symbol of the LP token
    /// @param  _token underlying token address
    /// @param  _strategy address of the strategy
    /// @param  _owner contract owner
    function initialize(
        string memory _name, string memory _symbol, address _token,
        address _strategy, uint256 _maxInvestmentPerc, address _owner
    ) external override initializer {
        ERC20Upgradeable.__ERC20_init(_name, _symbol);
        OwnableUpgradeable.__Ownable_init();

        underlying = ERC20(_token);
        underlyingUnit = 10 ** uint256(underlying.decimals());

        underlyingStrategy = _strategy;
        transferOwnership(_owner);

        require(_maxInvestmentPerc <= FULL_ALLOC, "PERC_HIGHER");
        maxInvestmentPerc = _maxInvestmentPerc;
    }

    /// @notice Deposits the underlying token into the liquidity pool.
    /// @param  depositAmount underlying token amount to deposit
    function deposit(uint256 depositAmount) public {

        require(depositAmount > 0, "ZERO_AMOUNT");
        require(underlying.allowance(msg.sender, address(this)) >= depositAmount, "INSUFFICIENT_ALLOWANCE");

        uint256 toMint = _calculateMintAmount(depositAmount);

        // Mint LP to sender.
        _mint(msg.sender, toMint);

        // Transfer the tokens from the sender to this contract.
        underlying.safeTransferFrom(msg.sender, address(this), depositAmount);

        emit Deposited(msg.sender, depositAmount);
    }

    /// @notice Redeems LP tokens by burning them and getting back underlying token.
    /// @param  _redeemAmount LP token amount to redeem.
    /// @return redeemedTokens underlying tokens redeemed
    function redeem(uint256 _redeemAmount) public returns (uint256 redeemedTokens) {

        uint256 totalSupply = totalSupply();
        require(totalSupply > 0, "ZERO_SUPPLY");
        require(_redeemAmount > 0, "ZERO_AMOUNT");
        require(_redeemAmount <= balanceOf(msg.sender), "INSUFFICIENT_BALANCE");

        uint256 totalBalance = underlyingBalanceInclStrategy();
        uint256 underlyingBalance = underlyingBalanceInPool();
        uint256 underlyingAmountToWithdraw = totalBalance.mul(_redeemAmount).div(totalSupply);


        if (underlyingAmountToWithdraw > underlyingBalance) {
            uint256 missingUnderlying = underlyingAmountToWithdraw.sub(underlyingBalance);
            uint256 missingRedeemed = missingUnderlying.mul(totalSupply).div(totalBalance.sub(underlyingBalance));

            redeemedTokens = IStrategy(underlyingStrategy).redeem(
                missingRedeemed, totalSupply, address(this)
            );

            redeemedTokens = Math.min(
                underlyingBalanceInclStrategy()
                .mul(_redeemAmount)
                .div(totalSupply),
                underlyingBalanceInPool()
            );
        } else {
            redeemedTokens = underlyingAmountToWithdraw;
        }

        // TODO charge exit fee
        //redeemedTokens = _chargeFee(_redeemAmount, redeemedTokens);
        // Burn LP from sender
        _burn(msg.sender, _redeemAmount);
        // send underlying to sender
        underlying.safeTransfer(msg.sender, redeemedTokens);

        emit Redeemed(msg.sender, redeemedTokens);
    }

    /// @notice Execute a rebalance. Only owner.
    ///         Fails if the rebalance would result into lower APR.
    function rebalance() external onlyOwner {

        uint256 aprBefore = getAPR();
        uint256 totalSupply = totalSupply();
        // redeem the full supply
        IStrategy(underlyingStrategy).redeem(totalSupply, totalSupply, address(this));
        // re-invest
        _invest();
        // rebalance the supplied investment
        IStrategy(underlyingStrategy).rebalance();
        uint256 aprAfter = getAPR();

        require(aprBefore <= aprAfter, "LOWER_APR");
    }

    /// @notice APR for the investment
    function getAPR() public view returns (uint256 apr) {
        return IStrategy(underlyingStrategy).getAPR();
    }

    function decimals() public view virtual override returns (uint8) {
        return uint8(underlying.decimals());
    }

    /// @notice Get the balance of the underlying token owned by the pool itself.
    /// @return uint256 underlying balance.
    function underlyingBalanceInPool() public view returns (uint256) {
        return underlying.balanceOf(address(this));
    }

    /// @notice Get the total balance of the underlying token owned by the pool and its strategies.
    /// @return total underlying balance.
    function underlyingBalanceInclStrategy() public view returns (uint256) {
        if (underlyingStrategy == address(0)) {
            return underlyingBalanceInPool();
        }

        return underlyingBalanceInPool().add(IStrategy(underlyingStrategy).investedUnderlyingBalance());
    }

    function getPricePerFullShare() public view returns (uint256) {
        return totalSupply() == 0
            ? underlyingUnit
            : underlyingUnit.mul(underlyingBalanceInclStrategy()).div(totalSupply());
    }

    /// @notice Calculate the LP token amount that correspondents to the underlying token amount.
    /// @param  depositAmount underlying token amount to deposit.
    /// @return uint256 LP token amount to mint.
    function _calculateMintAmount(uint256 depositAmount) internal view returns (uint256) {
        uint256 totalSupply = totalSupply();

        if (totalSupply == 0) {
            return depositAmount.mul(DEFAULT_LPT_RATE);
        }

        return depositAmount.mul(totalSupply).div(underlyingBalanceInclStrategy());
    }

    function availableToInvestOut() public view returns (uint256) {
        uint256 wantInvestInTotal = underlyingBalanceInclStrategy()
        .mul(maxInvestmentPerc)
        .div(FULL_ALLOC);
        uint256 alreadyInvested = IStrategy(underlyingStrategy).investedUnderlyingBalance();
        if (alreadyInvested >= wantInvestInTotal) {
            return 0;
        } else {
            uint256 remainingToInvest = wantInvestInTotal.sub(alreadyInvested);
            return remainingToInvest <= underlyingBalanceInPool()
            ? remainingToInvest : underlyingBalanceInPool();
        }
    }

    function _invest() internal {
        uint256 availableAmount = availableToInvestOut();
        if (availableAmount > 0) {
            underlying.safeTransfer(underlyingStrategy, availableAmount);
        }
    }
}
