
const AaveStrategy = artifacts.require("AaveStrategy");

module.exports = async function(deployer) {
	await deployer.deploy(AaveStrategy);
}