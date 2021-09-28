const Pool = artifacts.require("Pool");

module.exports = async function(deployer) {
	await deployer.deploy(Pool);
}