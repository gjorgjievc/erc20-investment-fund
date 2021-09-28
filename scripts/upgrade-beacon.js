const PoolFactory = artifacts.require("PoolFactory");
const PoolV2 = artifacts.require("PoolV2");

module.exports = async(callback) => {
    
    try {
        const poolV2instance = await PoolV2.deployed();
        const factoryInstance = await PoolFactory.deployed();
        
        // set the new implementation of Pool
        await factoryInstance.upgradeTo(poolV2instance.address);

    } catch(error) {
        console.log(error);
    }
    callback();
} 