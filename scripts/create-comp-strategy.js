const CompoundStrategyFactory = artifacts.require("CompoundStrategyFactory");
const ContractRegistry = artifacts.require("ContractRegistry");

module.exports = async(callback) => {

    const cToken = process.env.CTOKEN;
    const token = process.env.TOKEN;
    const compToken = process.env.COMP;
    const comptroller = process.env.COMPTROLLER;
    const uniswapRouterV2 = process.env.UNISWAP_ROUTER_V2;
    try {

        if (!cToken) {
            throw new Error('Invalid Comp token');
        }

        if (!token) {
            throw new Error('Invalid underlying token');
        }


        const factoryInstance = await CompoundStrategyFactory.deployed();
        const registryInstance = await ContractRegistry.deployed();

        // init data for L2 token
        const _data = web3.eth.abi.encodeParameters(['address', 'address', 'address', 'address'],
            [cToken, compToken, comptroller, uniswapRouterV2]);

        const receipt = await factoryInstance.createStrategy(
            token, registryInstance.address, _data
        );
        console.log('receipt:', receipt);
    } catch (error) {
        console.log(error);
    }
    callback();
}