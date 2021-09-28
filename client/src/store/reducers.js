import { combineReducers } from 'redux';
import * as types from './actionTypes';

function web3(state = {}, action) {
    switch(action.type) {
        case types.WEB3_LOADED:
            return {...state, connection: action.connection }
        case types.WEB3_ACCOUNT_LOADED:
            return {...state, account: action.account }
        default:
            return state;
    }
}
function poolFactory(state = {}, action) {
    switch(action.type) {
        case types.POOLFACTORY_LOADED:
            return {...state, contract: action.contract }
        case types.TOKENS_INDEX:
            return {...state, tokensIndex: action.index }
        default:
            return state;
    }
}   

function pool(state = [], action) {
    switch(action.type) {
        case types.POOL_INSTANCE_CREATED:
            return  [
                        ...state,
                    {
                        contract: action.contract,
                        decimals: action.decimals,
                        poolName: action.poolName,
                        supply: action.poolSupply,
                        userPoolBalance: action.userPoolBalance,
                        userTokenBalance: action.userTokenBalance,
                        tokenAddress: action.tokenAddress,
                        poolAddress: action.poolAddress
                    }
            ]        
        case types.UPDATE_POOL_VALUE:
            return state.map(pool => {
                if(pool.poolAddress === action.poolAddress) {
                return {
                        ...pool,
                        supply: action.poolSupply,
                        userPoolBalance: action.userPoolBalance,
                        userTokenBalance: action.userTokenBalance,
                    }
                }
                return pool;
            })
        case types.POOLS_CLEARED:
            return {state:[]} 
        default:
            return state;
    }
}

function isLoading(state = {instancesLoaded: false}, action) {
    switch(action.type) {
        case types.DEPOSITING_TOKENS:
            return {...state, isDepositing: true}
        case types.REDEEMING_TOKENS:
            return {...state, isRedeeming: true}
        case types.UPDATE_POOL_VALUE:
            return {...state, isDepositing: false, isRedeeming: false}
        case types.INSTANCES_LOADED:
            return {...state, instancesLoaded: true}
        case types.HANDLE_ERROR:
            return {...state, isDepositing: false, isRedeeming: false, instancesLoaded: false}
        default:
            return state;
    }
}

const rootReducer = combineReducers({
    web3,
    poolFactory,
    pool,
    isLoading
})

export default rootReducer;
