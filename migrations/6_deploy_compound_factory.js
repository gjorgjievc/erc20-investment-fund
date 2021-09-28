const CompoundStrategy = artifacts.require("CompoundStrategy");
const CompoundStrategyFactory = artifacts.require("CompoundStrategyFactory");

module.exports = async function(deployer) {
	const strategyInstance = await CompoundStrategy.deployed();
	await deployer.deploy(CompoundStrategyFactory, strategyInstance.address);
}