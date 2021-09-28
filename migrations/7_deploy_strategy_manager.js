
const StrategyManager = artifacts.require("StrategyManager");

module.exports = async function(deployer) {
	await deployer.deploy(StrategyManager);
}