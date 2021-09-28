import React, { useState } from 'react'
import { Container, Row, Col} from 'react-bootstrap'
import { Pie } from 'react-chartjs-2'
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Pool.css'
import '../styles/PoolResponsive.css'
import NaNConverter from '../helpers/NaN-converter.js'
import { tokenDeposit, tokenRedeem } from '../store/interactions';
import { connect } from 'react-redux';


function Pool({
  web3, 
  poolInstance,
  decimals,
  account, 
  poolAddress, 
  tokenAddress, 
  supply, 
  poolName, 
  userPoolBalance, 
  userTokenBalance, 
  isDepositing,
  isRedeeming, 
  dispatch }) {

  const [amount, setAmount] = useState('');

  const handleDeposit = async (e) => {
    e.preventDefault();
    await tokenDeposit(web3, decimals, poolInstance, poolAddress, tokenAddress, amount, account, dispatch)
  }
  const handleRedeem = async(e) => {
    e.preventDefault();
    await tokenRedeem(web3, decimals, poolInstance, poolAddress, tokenAddress, amount, account, dispatch)
  }

  const handleInputChange = (e) => {
    setAmount(e.target.value);
  }
  return (
    <Container style={{maxWidth: '75%', marginTop: '5%'}}>
      <Row className="first-row">
        <Col className="first-row-first-column">
          <div className="pie-chart">
            <h1 className='title'>{poolName} Deposit</h1>
            <hr></hr>
            <Pie className="chart"
              data={{
                labels: ['Your Deposit', 'Others Deposit'],
                datasets: [
                  {
                    data: [userPoolBalance, 
                      supply - userPoolBalance 
                    ],
                    backgroundColor: [
                      'rgb(250,196,77)',
                      'rgb(56,61,81)'  
                    ],
                    borderColor: [
                      '#F1F1F3',
                      '#F1F1F3',  
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                    position: 'bottom',
                    labels: {
                      font: {
                        size: 13
                      },
                    }
                  }
                }
              }}
            />
          </div>
        </Col>
        <Col className="first-row-second-column">
          <h1 className='title'>Pool Action</h1>
          <hr></hr>
          <Row className="input-row">
            <input disabled={isRedeeming || isDepositing} type="number" autoComplete="off" className="amount" placeholder="Amount" name="amount" value={amount} onChange={handleInputChange}/> 
          </Row>
          <Row className="btn-row">
            <Col>
              <button className="card-btn" id="deposit" onClick={handleDeposit} 
                  disabled={isDepositing || isRedeeming || userTokenBalance === 0 || (userTokenBalance - amount < 0) || amount <= 0}>
                  {isDepositing 
                  ? (<><i className="fa fa-spinner fa-spin"style={{ marginRight: "5px" }}/> Depositing... </>) 
                  : <span>Deposit</span>
                  }
              </button>
              <div className='inline'><div id="balance">{poolName}: {userTokenBalance}</div></div>
            </Col>
            <Col>
              <button className="card-btn" id="redeem" onClick={handleRedeem} 
                disabled={isDepositing || isRedeeming ||  userPoolBalance <= 0 || (userPoolBalance - amount < 0) || amount <= 0}>
                  {isRedeeming 
                  ? (<><i className="fa fa-spinner fa-spin"style={{ marginRight: "5px" }}/> Redeeming...</>) 
                  : <span>Redeem</span>
                  }
              </button>
              <div>
                <div className='inline'><div id="lpt-balance">LPT: {userPoolBalance}</div></div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row> 
      <Row className="second-row">
        <Col className="column">
          <table className="stats">
            <thead>
              <tr className="pool-thead-row">
                <th>Pool</th>
                <th>Total Supply</th>
                <th>Your LPT Balance</th>
                <th>{poolName} Balance</th>
                <th>Your Pool Share</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="token-name">{poolName}</td>
                <td>{supply}</td>
                <td>{userPoolBalance}</td>
                <td>{userTokenBalance}</td>
                <td>{(NaNConverter(parseFloat(userPoolBalance / supply * 100).toFixed(2)) + '%')}</td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>  
    </Container> 
  )
}
const mapStateToProps = (state) => {
  return {
      web3: state.web3.connection,
      account: state.web3.connection.currentProvider.selectedAddress,
      poolInstances: state.pool,
      tokenAddresses: state.poolFactory.tokenAddresses,
      isDepositing: state.isLoading.isDepositing,
      isRedeeming: state.isLoading.isRedeeming
  }
}  

export default connect(mapStateToProps)(Pool);
