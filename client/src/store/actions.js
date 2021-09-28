import * as types from './actionTypes';

export function web3Loaded(connection) {
    return {
      type: types.WEB3_LOADED,
      connection
    }
}
  
export function web3AccountLoaded(account) {
    return {
        type: types.WEB3_ACCOUNT_LOADED,
        account
    }
}

export function networkIdLoaded(network) {
    return {
        type: types.NETWORK_ID_LOADED,
        network
    }
}

export function poolFactoryLoaded(contract) {
    return {
        type: types.POOLFACTORY_LOADED,
        contract
    }
}

export function poolLoaded(contract) {
    return {
        type: types.POOL_LOADED,
        contract
    }
}

export function tokensIndex(index) {
    return {
        type: types.TOKENS_INDEX,
        index
    }   
}


export function poolForToken(contract, decimals, poolName, poolSupply, userPoolBalance, userTokenBalance, poolAddress, tokenAddress ) {
    return {
        type: types.POOL_INSTANCE_CREATED,
        contract,
        decimals,
        poolName,
        poolSupply,
        userPoolBalance,
        userTokenBalance,
        poolAddress, 
        tokenAddress
    }
}

export function instancesLoaded() {
    return {
        type: types.INSTANCES_LOADED
    }
}

export function amountChanged(userPoolBalance, userTokenBalance, poolSupply, poolAddress) {
    return {
        type: types.UPDATE_POOL_VALUE,
        userPoolBalance,
        userTokenBalance,
        poolSupply,
        poolAddress
    }   
}

export function redeemInProgress(){
    return {
        type: types.REDEEMING_TOKENS
    }
}
export function depositInProgress(){
    return {
        type: types.DEPOSITING_TOKENS
    }
}

export function handleError(){
    return {
        type: types.HANDLE_ERROR
    }
}
export function clearPools(){
    return {
        type: types.POOLS_CLEARED
    }
}
