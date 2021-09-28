
const CompoundStrategy = artifacts.require("CompoundStrategy");

module.exports = async function(deployer) {
	await deployer.deploy(CompoundStrategy);
}