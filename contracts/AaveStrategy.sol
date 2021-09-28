// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IAToken.sol";
import "./interfaces/IAaveIncentivesController.sol";
import "./interfaces/ILendingPoolAddressesProvider.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IContractRegistry.sol";
import "./interfaces/IStrategy.sol";
import "./interfaces/IPool.sol";

/// @title  AaveStrategy
/// @notice Strategy that invests the underlying token into Aave.
///         The strategy is owned by the underlying token pool.
/// @dev    needs to be upgradeable, so that it complies with the beacon proxy pattern.
contract AaveStrategy is IStrategy, OwnableUpgradeable {

    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 private constant ONE_18 = 10**18;

    /// @notice Protocol token address (aToken)
    address public protocolToken;

    /// @notice Underlying token address
    address public override underlying;

    /// @notice contract registry
    IContractRegistry public contractRegistry;

    /// @notice uniswap router
    address public uniswapRouterV2;

    uint256 public rewardThreshold;

    /// aave provider
    ILendingPoolAddressesProvider public provider;

    /// @dev only pool controllers
    modifier onlyController() {
        address poolAddress = contractRegistry.poolFactory().poolAddresses(underlying);
        require(msg.sender == IPool(poolAddress).underlyingStrategy()
            || msg.sender == poolAddress
            || msg.sender == owner(),
            "NOT_POOL_CONTROLLER");
        _;
    }

    /// @notice Initialize the contract instead of a constructor during deployment.
    /// @param  _underlying Underlying token address
    /// @param  _registry Contract registry address
    /// @param  _owner Contract owner
    /// @param  _data init data
    function initialize(address _underlying, address _registry, address _owner, bytes memory _data)
    external override initializer {

        require(_underlying != address(0) && _owner != address(0) && _registry != address(0), "ZERO_ADDRESS");

        (address _token, address _addressesProvider, address _uniswapRouterV2) = abi.decode(
        _data, (address, address, address));

        OwnableUpgradeable.__Ownable_init();

        protocolToken = _token;
        underlying = _underlying;
        rewardThreshold = 1 * (10 ** uint256(18));

        provider = ILendingPoolAddressesProvider(_addressesProvider);
        uniswapRouterV2 = _uniswapRouterV2;

        contractRegistry = IContractRegistry(_registry);

        transferOwnership(_owner);
    }

    /// @notice Redeems protocol tokens for underlying tokens.
    ///         This method assumes the protocol tokens are already available in this contract.
    /// @param  _redeemAmount shares amount to redeem.
    /// @param  _totalSupply total shares.
    /// @param  _account address to send redeemed tokens to.
    //  @return tokens redeemed.
    function redeem(uint256 _redeemAmount, uint256 _totalSupply, address _account) external override onlyController
    returns (uint256 tokens) {

        IERC20 _underlying = IERC20(underlying);

        uint256 aTokensToRedeem = _redeemAmount.mul(_protocolTokenBalanceOf()).div(_totalSupply);
        require(_protocolTokenBalanceOf() >= aTokensToRedeem, "NO_FUNDS");

        ILendingPool(provider.getLendingPool()).withdraw(
            underlying, aTokensToRedeem, address(this)
        );

        tokens = _underlyingBalanceOf();
        _underlying.safeTransfer(_account, tokens);
    }

    /// @notice Execute a rebalance by liquidating the gov rewards and reinvesting into the protocol.
    function rebalance() external override onlyController {
        _liquidateReward();
        _mint();
    }

    /// @notice Amount of the underlying token invested in protocol token.
    ///         Aave is  1-1 mapped to underlying
    /// @return uint256 underlying balance.
    function investedUnderlyingBalance() external override view returns (uint256) {
        return _protocolTokenBalanceOf();
    }

    /// @notice APR for the current protocol token
    function getAPR() external override view returns (uint256 apr) {
        DataTypes.ReserveData memory data = ILendingPool(provider.getLendingPool()).getReserveData(underlying);
        return uint256(data.currentLiquidityRate).div(10**7); // .mul(100).div(10**9)
    }

    /// @notice Mints new protocol tokens in the strategy for underlying tokens.
    ///         This method assumes the underlying tokens were already transferred to this strategy.
    /// @return aTokens protocol tokens minted
    function _mint() internal returns (uint256 aTokens) {
        uint256 balance = _underlyingBalanceOf();
        if (balance == 0) {
            return aTokens;
        }

        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        IERC20(underlying).safeApprove(address(lendingPool), 0);
        IERC20(underlying).safeApprove(address(lendingPool), balance);

        lendingPool.deposit(underlying, balance, address(this), 0);
    }

    function _liquidateReward() internal {

        IAaveIncentivesController controller = IAaveIncentivesController(
            IAToken(protocolToken).getIncentivesController()
        );

        // claim the reward token
        address[] memory assets = new address[](1);
        assets[0] = protocolToken;
        uint256 rewardBalance = controller.getRewardsBalance(assets, address(this));
        if (rewardBalance == 0) {
            return;
        }
        controller.claimRewards(assets, rewardBalance, address(this));

        // check the reward token
        address rewardToken = controller.REWARD_TOKEN();
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));

        // TODO check some thresholds, so that we dont liquidity low token amounts
        if (balance < rewardThreshold) {
            return;
        }

        uint256 amountOutMin = 1;
        IERC20(rewardToken).safeApprove(address(uniswapRouterV2), 0);
        IERC20(rewardToken).safeApprove(address(uniswapRouterV2), balance);
        address[] memory path = new address[](3);
        path[0] = rewardToken;
        path[1] = IUniswapV2Router02(uniswapRouterV2).WETH();
        path[2] = underlying;
        IUniswapV2Router02(uniswapRouterV2).swapExactTokensForTokens(
            balance,
            amountOutMin,
            path,
            address(this),
            block.timestamp
            );
    }

    /// @notice Amount of the protocol tokens owned by this contact.
    /// @return uint256 protocol token balance
    function _protocolTokenBalanceOf() internal view returns (uint256) {
        return IERC20(protocolToken).balanceOf(address(this));
    }

    /// @notice Amount of the underlying tokens owned by this contact.
    /// @return uint256 underlying balance
    function _underlyingBalanceOf() internal view returns (uint256) {
        return IERC20(underlying).balanceOf(address(this));
    }
}