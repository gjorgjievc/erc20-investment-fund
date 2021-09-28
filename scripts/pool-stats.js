const CompoundStrategyFactory = artifacts.require("CompoundStrategyFactory");
const AaveStrategyFactory = artifacts.require("AaveStrategyFactory");
const StrategyManagerFactory = artifacts.require("StrategyManagerFactory");
const PoolFactory = artifacts.require("PoolFactory");
const Pool = artifacts.require("Pool");
const IStrategy = artifacts.require("IStrategy");
const IERC20 = artifacts.require("IERC20");

module.exports = async(callback) => {

    const token = process.env.TOKEN;
    const cToken = process.env.CTOKEN;
    const aToken = process.env.ATOKEN;
    try {

        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];

        const strategyManagerFactoryInstance = await StrategyManagerFactory.deployed();
        // get latest strategy address for the given token
        const strategyManagerAddress = await strategyManagerFactoryInstance.strategyManagers(token);

        const factoryInstance = await PoolFactory.deployed();
        // get latest pool address for the given token
        const poolAddress = await factoryInstance.poolAddresses(token);

        const compFactoryInstance = await CompoundStrategyFactory.deployed();
        // get latest strategy address for the given token
        const compStrategyAddress = await compFactoryInstance.poolStrategies(token);

        const aaveFactoryInstance = await AaveStrategyFactory.deployed();
        // get latest strategy address for the given token
        const aaveStrategyAddress = await aaveFactoryInstance.poolStrategies(token);

        const poolInstance = await Pool.at(poolAddress);
        const tokenInstance = await IERC20.at(token);
        const cTokenInstance = await IERC20.at(cToken);
        const aTokenInstance = await IERC20.at(aToken);

        const compPool = await IStrategy.at(compStrategyAddress);
        const aavePool = await IStrategy.at(aaveStrategyAddress);

        const aavePoolInvested = await aavePool.investedUnderlyingBalance();
        const compPoolInvested = await compPool.investedUnderlyingBalance();

        const balanceInAccount = await tokenInstance.balanceOf(currentAccount);
        const balanceInManager = await tokenInstance.balanceOf(strategyManagerAddress);

        const balanceInCompStrategy = await tokenInstance.balanceOf(compStrategyAddress);
        const cTokenBalanceInStrategy = await cTokenInstance.balanceOf(compStrategyAddress);
        const cTokenBalanceInManager = await cTokenInstance.balanceOf(strategyManagerAddress);

        const balanceInAaveStrategy = await tokenInstance.balanceOf(compStrategyAddress);
        const aTokenBalanceInStrategy = await aTokenInstance.balanceOf(aaveStrategyAddress);
        const aTokenBalanceInManager = await aTokenInstance.balanceOf(strategyManagerAddress);

        const compBalance = await compPool.investedUnderlyingBalance();
        const aaveBalance = await aavePool.investedUnderlyingBalance();

        const underlyingBalanceInPool = await poolInstance.underlyingBalanceInPool();
        const underlyingBalanceInStrategy = await poolInstance.underlyingBalanceInclStrategy();
        const apr = await poolInstance.getAPR();
        console.log(' APR ' + apr);
        console.log('balanceInAccount:', balanceInAccount.toString());
        console.log('underlyingBalanceInPool:', underlyingBalanceInPool.toString());
        console.log('underlyingBalanceIncludeStrategy:', underlyingBalanceInStrategy.toString());
        console.log('balanceInManager:', balanceInManager.toString());

        console.log('balanceInCompStrategy:', balanceInCompStrategy.toString());
        console.log('cTokenBalanceInStrategy:', cTokenBalanceInStrategy.toString());
        console.log('cTokenBalanceInManager:', cTokenBalanceInManager.toString());
        console.log('compInvestedUnderlyingBalance:', compBalance.toString());

        console.log('balanceInAaveStrategy:', balanceInAaveStrategy.toString());
        console.log('aTokenBalanceInStrategy:', aTokenBalanceInStrategy.toString());
        console.log('aTokenBalanceInManager:', aTokenBalanceInManager.toString());
        console.log('aaveInvestedUnderlyingBalance:', aaveBalance.toString());

    } catch (error) {
        console.log(error);
    }
    callback();
}