import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom'
import '../styles/AppBar.css'
import '../styles/AppBarResponsive.css'
import truncateAString from '../helpers/truncate-address'
import copyIcon from '../assets/images/copy.svg'
import { toast } from 'react-toastify'

function AppBar() {
  const history = useHistory()
  const [user, setUser] = useState('')
  const [chainId, setChainId] = useState(null)
  const [connected, setConnected] = useState(false)

  const [click, setClick] = useState(false)

  const handleClick = () => setClick(!click)

  useEffect(() => {
    connectMeta()
    //eslint-disable-next-line
  }, [])

  const ethereum = window.ethereum
  ethereum.on('accountsChanged', handleAccountsChange)
  ethereum.on('chainChanged', handleChainChange)

  function handleChainChange(_chainId) {
    console.log(_chainId)
    setChainId(_chainId)
  }

  function handleAccountsChange(accounts) {
    if (accounts.length === 0) {
      console.log('Please connect to MetaMask.')
      setUser('')
      setChainId('')
      setConnected(false)
      history.push('/')
    } else if (accounts[0] !== user) {
      console.log(accounts)
      setUser(accounts[0])
    }
  }

  const connectMeta = async () => {
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const _chainId = await ethereum.request({ method: 'eth_chainId' })
      setUser(accounts[0])
      setChainId(_chainId)
      if (ethereum.isConnected()) {
        setConnected(true)
      }
    } catch (error) {
      console.log(error)
    }
  }
  const copyAddress = () => {
    navigator.clipboard.writeText(user)
    toast('Address copied')
  }

  const getNetwork = (chainId) => {
    switch (chainId) {
      case '0x4':
        return 'Rinkeby'
      case '0x539':
        return 'Local'
      default:
        return 'change network'
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            ERC20 Pools
          </Link>
          <div className="div-link">
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className="nav-item">
              <Link to="/pools" activeclassname="active" className="nav-links">
                Pools
              </Link>
            </li>
            </ul>
          </div>
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className="nav-item-two">
              <div className="address">
                <>
                  <span className="address-btn network" disabled={true}>{getNetwork(chainId)}</span>
                  <span className="address-btn account">{truncateAString(user)} &nbsp; <img className="copyAddress" onClick={copyAddress} type="button" alt="copy" title="Copy address" src={copyIcon} /></span>
                </>   
              </div>
            </li>
          </ul>
          <div className="nav-icon" onClick={handleClick}>
            <i className={click ? 'fas fa-times' : 'fas fa-bars'}></i>
          </div>
        </div>
      </nav>
    </>
  )
}

export default AppBar