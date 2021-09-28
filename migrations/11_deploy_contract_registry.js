const ContractRegistry = artifacts.require("ContractRegistry");

const CompoundStrategyFactory = artifacts.require("CompoundStrategyFactory");
const PoolFactory = artifacts.require("PoolFactory");
const StrategyManagerFactory = artifacts.require("StrategyManagerFactory");
const AaveStrategyFactory = artifacts.require("AaveStrategyFactory");

module.exports = async function(deployer) {
	await deployer.deploy(ContractRegistry);

	const poolFactoryInstance = await PoolFactory.deployed();
	const compFactoryInstance = await CompoundStrategyFactory.deployed();
	const strategyManagerFactory = await StrategyManagerFactory.deployed();
	const aaveFactoryInstance = await AaveStrategyFactory.deployed();

	const registryInstance = await ContractRegistry.deployed();
	await registryInstance.importContracts(
		[poolFactoryInstance.address, compFactoryInstance.address,
			strategyManagerFactory.address, aaveFactoryInstance.address]
	);
}