const Pool = artifacts.require("Pool");
const PoolFactory = artifacts.require("PoolFactory");

module.exports = async(callback) => {

    const token = process.env.TOKEN;
    try {

        if (!token) {
            throw new Error('Invalid underlying token');
        }
        const factoryInstance = await PoolFactory.deployed();
        // get latest pool address for the given token
        const poolAddress = await factoryInstance.poolAddresses(token);
        const poolInstance = await Pool.at(poolAddress);

        const receipt = await poolInstance.rebalance();
        console.log('receipt:', receipt);

    } catch (error) {
        console.log(error);
    }
    callback();
}