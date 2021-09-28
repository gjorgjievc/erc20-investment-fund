const BalastERC20 = artifacts.require("BalastERC20");
require("dotenv").config({path: "../.env"});

module.exports = async function(deployer) {
	await deployer.deploy(BalastERC20, process.env.INITIAL_TOKENS);
}
