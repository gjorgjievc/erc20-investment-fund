import React from "react";
import { Button } from 'react-bootstrap';
import detectEthereumProvider from '@metamask/detect-provider';
import { useHistory } from 'react-router-dom'
import './LandingConnect.css';
import { toast } from "react-toastify";

function LandingConnect() {
  const history = useHistory()
  const ethereum = window.ethereum;

  const SignIn = async () => {
    const provider = await detectEthereumProvider()

    if (!provider) {
      toast('Wallet not found, please install MetaMask!')
    } else {
      await connectMetamask()
    }
  }

  const connectMetamask = async () => {
    try {
      await ethereum.request({ method: 'eth_requestAccounts' })

      if (ethereum.isConnected()) {
        history.push('/pools')
      }
    } catch (error) {
      if (error.code === 4001) {
        toast('Please connect to MetaMask.')
      } else if (error.code === -32002) {
        toast('Please unlock MetaMask.')
      } else {
        console.log(error)
      }
    }
  }

  return (
    <div className="landing" >
      <div className="entry" onClick={SignIn}> 
        <h1>enter app</h1>
      </div>
    </div>
  )
}
export default LandingConnect
