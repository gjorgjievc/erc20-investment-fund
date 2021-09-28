const Pool = artifacts.require('Pool')
const PoolFactory = artifacts.require('PoolFactory')
const Governance = artifacts.require('Governance')

module.exports = async (callback) => {
  const fromWei = (amount) => {
    return web3.utils.fromWei(amount)
  }

  const daiToken = '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735'

  try {
    const factoryInstance = await PoolFactory.deployed()

    const governanceInstance = await Governance.deployed()

    const poolAddress = await factoryInstance.poolAddresses(daiToken)
    console.log('Pool Address', poolAddress)

    const poolInstance = await Pool.at(poolAddress)

    const accounts = await web3.eth.getAccounts()

    // Claim

    const reward = await poolInstance.calculateReward({ from: accounts[0] })
    console.log(fromWei(reward.toString()))

    await poolInstance.claim(governanceInstance.address, { from: accounts[0] })

  } catch (error) {
    console.log(error)
  }
  callback()
}
