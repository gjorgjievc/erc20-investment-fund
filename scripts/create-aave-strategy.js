const AaveStrategyFactory = artifacts.require("AaveStrategyFactory");
const ContractRegistry = artifacts.require("ContractRegistry");

module.exports = async(callback) => {

    const token = process.env.TOKEN;
    const aToken = process.env.ATOKEN;
    const addressProvider = process.env.AAVE_PROVIDER;
    const uniswapRouterV2 = process.env.UNISWAP_ROUTER_V2;
    try {

        if (!aToken) {
            throw new Error('Invalid Aave token');
        }

        if (!token) {
            throw new Error('Invalid underlying token');
        }


        const factoryInstance = await AaveStrategyFactory.deployed();
        const registryInstance = await ContractRegistry.deployed();

        // init data for L2 token
        const _data = web3.eth.abi.encodeParameters(['address', 'address', 'address'],
            [aToken, addressProvider, uniswapRouterV2]);

        const receipt = await factoryInstance.createStrategy(
            token, registryInstance.address, _data
        );
        console.log('receipt:', receipt);
    } catch (error) {
        console.log(error);
    }
    callback();
}