const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");

const StrategyManagerFactory = artifacts.require("StrategyManagerFactory");

module.exports = async(callback) => {

    const token = process.env.CTOKEN;
    const uniswapRouterV2 = process.env.UNISWAP_ROUTER_V2;
    try {

        if (!token) {
            throw new Error('Invalid underlying token');
        }

        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];

        const uniswapRouter = await IUniswapV2Router02.at(uniswapRouterV2);
        const wethAddress = await uniswapRouter.WETH();

        let path = [wethAddress, token];
        const amountOutMin = '1' + Math.random().toString().slice(2,6);
        const amountToBuyWith = web3.utils.toWei("1");

        const receipt = await uniswapRouter.swapExactETHForTokens (
                web3.utils.toHex(amountOutMin),
                path, currentAccount,
                web3.utils.toHex(Math.round(Date.now()/1000)+60*20), {value: amountToBuyWith});

        console.log('receipt:', receipt);

    } catch (error) {
        console.log(error);
    }
    callback();
}