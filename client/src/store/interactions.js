import Web3 from "web3";
import { 
    web3Loaded, 
    web3AccountLoaded,
    networkIdLoaded, 
    poolFactoryLoaded, 
    poolLoaded,
    poolForToken,
    tokensIndex,
    amountChanged,
    handleError,
    depositInProgress,
    redeemInProgress
} from "./actions";
import PoolFactory from '../assets/contracts/PoolFactory.json';
import Pool from '../assets/contracts/Pool.json';
import IERC20 from '../assets/contracts/IERC20.json';
import ERC20 from '../assets/contracts/ERC20.json';
import { toast } from 'react-toastify';
const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const fromBN = (num, decimals) => {
    num = num /(10 ** decimals)
   return Number(num.toString().match(/^\d+(?:\.\d{0,6})?/));
}
const toBN = (num, decimals) => {
    return "0x" + (num * Math.pow(10, decimals)).toString(16);
}

export const loadWeb3 = (dispatch) => {
    const web3 = new Web3(Web3.givenProvider);
    dispatch(web3Loaded(web3));
    return web3;
}

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    dispatch(web3AccountLoaded(account));
    return account;

}

export const loadNetworkId = async (web3, dispatch) => {
    const network = await web3.eth.net.getId();
    dispatch(networkIdLoaded(network));
    return network;
}

export const loadPoolFactory = async (web3, networkId, dispatch) => {
    try {
        await networkId;
        const poolFactory = new web3.eth.Contract(PoolFactory.abi, PoolFactory.networks[networkId].address)
        dispatch(poolFactoryLoaded(poolFactory));
        return poolFactory;
    } catch(error) {
        console.log('PoolFactory Contract could not be loaded', error);
    }
}

export const loadPool = async (web3, networkId, dispatch) => {
    try {
        await networkId;
        const pool = new web3.eth.Contract(Pool.abi, Pool.networks[networkId].address);
        dispatch(poolLoaded(pool));
        return pool;
    } catch(error) {
        console.log('Pool Contract could not be loaded', error);
    }
}

export const getTokensIndex = async(poolFactory, dispatch) => {
    try {
        const index = await poolFactory.methods.getTokenAddresses().call();
        dispatch(tokensIndex(index))
        return index;
    } catch(error) {
        console.log('Could not get tokens index', error);
    }
}
export const getPoolForToken = async (web3, poolFactory, index, account, dispatch) => {
    try {
        const tokenAddress = await poolFactory.methods.tokenAddresses(index).call();
        const poolAddress = await poolFactory.methods.poolAddresses(tokenAddress).call();
        const poolInstance = await new web3.eth.Contract(Pool.abi, poolAddress);
        
        const ierc20 = new web3.eth.Contract(ERC20.abi, tokenAddress);

        const name = await poolInstance.methods.name().call();
        const decimals = await ierc20.methods.decimals().call();
        const _userDeposit = await poolInstance.methods.balanceOf(account).call();
        const _userTokenBalance = await ierc20.methods.balanceOf(account).call();
        const _supply = await poolInstance.methods.totalSupply().call();
        const userDeposit = fromBN(_userDeposit, decimals);
        const userTokenBalance = fromBN(_userTokenBalance, decimals);
        const supply = fromBN(_supply, decimals);

        dispatch(poolForToken(poolInstance, decimals, name, supply, userDeposit, userTokenBalance, poolAddress, tokenAddress));
        
        return {
            poolInstance,
            decimals,
            name,
            supply,
            userDeposit,
            userTokenBalance,
            poolAddress,
            tokenAddress
        };
    } catch(error) {
        console.log('Could not get pool for address', error);
    }
}

const updatePool = async(poolInstance, poolAddress, ierc20, decimals, account, dispatch) => {
    const _userDeposit = await poolInstance.methods.balanceOf(account).call();
    const _userTokenBalance = await ierc20.methods.balanceOf(account).call();
    const _supply = await poolInstance.methods.totalSupply().call();
    const userDeposit = fromBN(_userDeposit, decimals);
    const userTokenBalance = fromBN(_userTokenBalance, decimals);
    const supply = fromBN(_supply, decimals);

    dispatch(amountChanged(userDeposit, userTokenBalance, supply, poolAddress));
    return {
        userDeposit,
        userTokenBalance,
        supply,
        poolAddress
    }
}

export const tokenDeposit = async (web3, decimals, poolInstance, poolAddress, tokenAddress, amount, account, dispatch) => {
    const depositNotify = () => toast(`DEPOSIT - ${amount} tokens`);
    
    const _amount = toBN(amount, decimals);
    const ierc20 = new web3.eth.Contract(IERC20.abi, tokenAddress);
    dispatch(depositInProgress());
    const allowance = await ierc20.methods.allowance(account, poolAddress).call();
    //eslint-disable-next-line
    if(allowance == 0) {
        ierc20.methods.approve(poolAddress, MAX_UINT256).send({ from: account })
        .on('receipt', () => {
            poolInstance.methods.deposit(_amount).send({ from: account })
            .on('receipt', async () => {
                depositNotify();
                await updatePool(poolInstance, poolAddress, ierc20, decimals, account, dispatch);
            })
        })
        .on('error', (error) => {
            console.log('Could not deposit tokens', error);
            dispatch(handleError())
            // window.alert('There was an error depositing tokens')
        })
    } else {
        poolInstance.methods.deposit(_amount).send({ from: account })
            .on('receipt', async () => {
                depositNotify();
                await updatePool(poolInstance, poolAddress, ierc20, decimals, account, dispatch);
            })
        .on('error', (error) => {
            console.log('Could not deposit tokens', error);
            dispatch(handleError())
            
        })
    }
}

export const tokenRedeem =  async(web3, decimals, poolInstance, poolAddress, tokenAddress, amount, account, dispatch) => {
    const redeemNotify = () => toast(`REDEEM - ${amount} LPT tokens`);
    
    const _amount = toBN(amount, decimals)
    const ierc20 = new web3.eth.Contract(IERC20.abi, tokenAddress);
    const allowance = await poolInstance.methods.allowance(account,account).call()
    dispatch(redeemInProgress());
    //eslint-disable-next-line
    if(allowance == 0){
        poolInstance.methods.approve(account, MAX_UINT256).send({ from: account })
        .on('receipt', () => {
            poolInstance.methods.redeem(_amount).send({ from: account })
            .on('receipt', async () => {
                redeemNotify();
                await updatePool(poolInstance, poolAddress, ierc20, decimals, account, dispatch);
            })
        })
        .on('error', (error) => {
            console.log('Could not redeem tokens', error);
            dispatch(handleError())
                })
    } else {
        poolInstance.methods.redeem(_amount).send({ from: account })
        .on('receipt', async () => {
            redeemNotify();
            await updatePool(poolInstance, poolAddress, ierc20, decimals, account, dispatch);
        })
        .on('error', (error) => {
            console.log('Could not redeem tokens', error);
            dispatch(handleError())
        })
    }
}
