import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect } from "react";
import LandingConnect from './components/LandingConnect';
import Pools from './components/Pools';
import PoolContainer from './containers/PoolContainer';
import AppBar from './components/AppBar'
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast, ToastContainer } from "react-toastify";
import { 
  loadWeb3,
  loadNetworkId,
  loadAccount, 
  loadPoolFactory, 
  loadPool, 
  getPoolForToken,
  getTokensIndex
} from './store/interactions.js';
import { instancesLoaded } from "./store/actions";


function App() {
  
  const dispatch = useDispatch();

  useEffect(() => {
    loadPools(dispatch)
    //eslint-disable-next-line
  }, [])
  
  const ethereum = window.ethereum;
  ethereum.on('accountsChanged', handleAccountsChange);
  ethereum.on('chainChanged', handleAccountsChange);
  
  function handleAccountsChange() {
    window.location.replace('/')
    loadPools(dispatch);
  }

  const loadPools = async(dispatch) => {
    const Web3 = loadWeb3(dispatch);
    
    if(Web3.givenProvider == null) {
      toast('Please install metamask')
    } else {
      const networkId = await loadNetworkId(Web3, dispatch);
      const account = await loadAccount(Web3, dispatch)
      await loadPool(Web3, networkId, dispatch);

      const poolFactory = await loadPoolFactory(Web3, networkId, dispatch);

      const index = await getTokensIndex(poolFactory, dispatch);
      for(let i= 0; i < index; i++) {
        await getPoolForToken(Web3, poolFactory, i, account, dispatch);
        
        if(i === index-1){
          dispatch(instancesLoaded())
        }
      }
    }
  }
    return (
      <div className="App">
        <ToastContainer className="notify" autoClose={1600} position="top-center" style={{marginTop: '100px'}}/>
        <Router >
          <Route exact path={[
            "/pools",
            "/pools/:address",
          ]} 
            component={AppBar}
          />
          <Switch>
            <Route exact path="/" component={LandingConnect} />
            <Route exact path="/pools" component={Pools}/>
            <Route exact path="/pools/:address" component={PoolContainer} />
          </Switch>
        </Router>
      </div>
    );
}

export default App;