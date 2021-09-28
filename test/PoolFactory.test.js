const Pool = artifacts.require('Pool');
const PoolV2 = artifacts.require('PoolV2');
const PoolFactory = artifacts.require('PoolFactory');
const { expect } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('PoolFactory', async (accounts) => {

    const [ owner, other ] = accounts;
    let poolInstance;
    let factoryInstance;

    beforeEach('deploying factory', async () => {
        poolInstance = await Pool.new();
        factoryInstance = await PoolFactory.new(poolInstance.address, {from: owner});
    });
    
    describe('Upgradeable beacon', async () => {
        
        it('has an implementation', async() => {
            expect(await factoryInstance.implementation()).to.equal(poolInstance.address);
        })

        it('can be upgraded by owner', async() => {
            const _poolV2 = await PoolV2.new();
            await factoryInstance.upgradeTo(_poolV2.address, {from: owner});
            expect(await factoryInstance.implementation()).to.equal(_poolV2.address);
        })

        it('cannot be upgraded by non-owner', async() => {
            const _poolV2 = await PoolV2.new();
            await expectRevert(factoryInstance.upgradeTo(_poolV2.address, {from: other}),
            'Ownable: caller is not the owner'
            );

        })
    })  
    

    describe('createPool', async() => {
        const kromAddress = '0xd84137f8D22750398054C1eefaA94947ADBB1550';

        it('can create pool from token address', async() => {
            await factoryInstance.createPool(kromAddress, {from: owner});
            expect(await factoryInstance.getTokenAddresses()).to.be.a.bignumber.equal('1');
        })

        it('cannot create pool for same token address', async() => {
            await factoryInstance.createPool(kromAddress, {from: owner});
            await expectRevert(factoryInstance.createPool(kromAddress, {from: owner}),
            'ALREADY_CREATED');
        })

        it('only owner can create pools', async() => {
            
            await expectRevert(factoryInstance.createPool(kromAddress, {from: other}), 'Ownable: caller is not the owner')
        })
    })
    
})
