const CompoundStrategyFactory = artifacts.require("CompoundStrategyFactory");
const AaveStrategyFactory = artifacts.require("AaveStrategyFactory");
const ContractRegistry = artifacts.require("ContractRegistry");
const StrategyManagerFactory = artifacts.require("StrategyManagerFactory");

module.exports = async(callback) => {

    const token = process.env.TOKEN
    try {

        if (!token) {
            throw new Error('Invalid underlying token');
        }


        const compoundFactoryInstance = await CompoundStrategyFactory.deployed();
        // get latest strategy address for the given token
        const compStrategyAddress = await compoundFactoryInstance.poolStrategies(token);

        const aaveFactoryInstance = await AaveStrategyFactory.deployed();
        // get latest strategy address for the given token
        const aaveStrategyAddress = await aaveFactoryInstance.poolStrategies(token);

        const _data = web3.eth.abi.encodeParameters(['uint256[]', 'address[]'],
            [[60000000, 40000000], [compStrategyAddress, aaveStrategyAddress]]);

        const registryInstance = await ContractRegistry.deployed();
        const factoryInstance = await StrategyManagerFactory.deployed();
        const receipt = await factoryInstance.createStrategy(
            token, registryInstance.address, _data
        );
        console.log('receipt:', receipt);
    } catch (error) {
        console.log(error);
    }
    callback();
}