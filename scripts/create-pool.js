const Pool = artifacts.require("Pool");
const PoolFactory = artifacts.require("PoolFactory");

const StrategyManagerFactory = artifacts.require("StrategyManagerFactory");

module.exports = async(callback) => {

    const token = process.env.CTOKEN
    try {

        if (!token) {
            throw new Error('Invalid underlying token');
        }
        const factoryInstance = await PoolFactory.deployed();
        const strategyFactoryInstance = await StrategyManagerFactory.deployed();

        // get latest strategy address for the given token
        const strategyAddress = await strategyFactoryInstance.strategyManagers(token);

        const receipt = await factoryInstance.createPool(token, strategyAddress, 80000000);
        console.log('receipt:', receipt);
    } catch (error) {
        console.log(error);
    }
    callback();
}