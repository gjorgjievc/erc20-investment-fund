const Pool = artifacts.require("Pool");
const PoolFactory = artifacts.require("PoolFactory");

module.exports = async function(deployer) {
	const poolInstance = await Pool.deployed();
	await deployer.deploy(PoolFactory, poolInstance.address);
}