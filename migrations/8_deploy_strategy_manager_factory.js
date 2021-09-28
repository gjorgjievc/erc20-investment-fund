const StrategyManager = artifacts.require("StrategyManager");
const StrategyManagerFactory = artifacts.require("StrategyManagerFactory");

module.exports = async function(deployer) {
	const strategyInstance = await StrategyManager.deployed();
	await deployer.deploy(StrategyManagerFactory, strategyInstance.address);
}