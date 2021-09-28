const AaveStrategy = artifacts.require("AaveStrategy");
const AaveStrategyFactory = artifacts.require("AaveStrategyFactory");

module.exports = async function(deployer) {
	const strategyInstance = await AaveStrategy.deployed();
	await deployer.deploy(AaveStrategyFactory, strategyInstance.address);
}