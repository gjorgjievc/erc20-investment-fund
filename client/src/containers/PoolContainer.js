import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Pool from '../components/Pool';

function PoolContainer({
    web3, 
    poolInstances, 
    tokenAddresses, 
    account,
    isLoading, 
    isDepositing,
    isRedeeming, 
    dispatch, 
    ...props}) {
    
    const [instance, setInstance] = useState({})

    useEffect(() => {
        const addr = props.match.params.address;
        const instance = getPool(addr);
        setInstance(instance);
    //eslint-disable-next-line
    },[props.match.params.address, poolInstances]);
    

    const getPool = (_poolAddress) => (
       poolInstances.find(_instance => {
            return _instance.contract.options.address === _poolAddress
        })
    )
    
    if(!web3) {
        window.location.replace(localStorage.getItem('/pools'))
        window.location.reload()
    }

    return (
        <div>
            <Pool 
                web3={web3}
                poolInstance={instance.contract}
                decimals={instance.decimals}
                account={web3.account}
                poolAddress={instance.poolAddress}
                tokenAddress={instance.tokenAddress}
                supply={instance.supply}
                poolName={instance.poolName}
                userPoolBalance={instance.userPoolBalance}
                userTokenBalance={instance.userTokenBalance}
                dispatch={dispatch}
                isRedeeming={isRedeeming}
                isDepositing={isDepositing}
            />
           
        </div>
    )
    }

const mapStateToProps = (state) => {
    
    
    return {
        web3: state.web3.connection,
        // account: state.web3.connection.currentProvider.selectedAddress,
        poolInstances: state.pool,
        tokenAddresses: state.poolFactory.tokenAddresses,
        isDepositing: state.isLoading.isDepositing,
        isRedeeming: state.isLoading.isRedeeming
    }
}  
export default withRouter(connect(mapStateToProps)(PoolContainer));
