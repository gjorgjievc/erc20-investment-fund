const Pool = artifacts.require('Pool');
const IERC20 = artifacts.require('IERC20');
const PoolFactory = artifacts.require('PoolFactory');
const { expect } = require('chai');

contract('Pool', async(accounts) => {

    const [ owner, other ] = accounts;
    const kromAddress = '0xd84137f8D22750398054C1eefaA94947ADBB1550';
    let poolInstance;
    let factoryInstance;
    let kromPoolAddress;
    let kromPool;
    let ierc20;
    
    beforeEach('creating pool', async() => {
        poolInstance = await Pool.new();
        factoryInstance = await PoolFactory.new(poolInstance.address, {from: owner});
        await factoryInstance.createPool(kromAddress, {from: owner});
        kromPoolAddress = await factoryInstance.poolAddresses(kromAddress);
        ierc20 = await IERC20.at(kromAddress);
        kromPool = await Pool.at(kromPoolAddress);
    })
    describe('Deposit tokens to pool', async() => {

        beforeEach('approve token spending', async() => {
            await ierc20.approve(kromPoolAddress, '10', {from: owner});
        })

        it('user can deposit tokens', async() => {
            await kromPool.deposit('10', {from: owner});
            expect(await kromPool.totalSupply()).to.be.a.bignumber.equal('10');
        })
        
        it('user can redeem tokens', async() => {
            await kromPool.deposit('10', {from: owner});
            console.debug(`Pool supply: ${await kromPool.totalSupply()}`);

            await kromPool.approve(owner, '10', {from: owner});
            await kromPool.redeem('10', {from: owner});
            expect(await kromPool.totalSupply()).to.be.a.bignumber.equal('0');
        })
    })
})
