import React from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom'
import { Container, Row, Col, Spinner } from 'react-bootstrap'
import '../styles/Pools.css'
import '../styles/PoolsResponsive.css'
import NaNConverter from '../helpers/NaN-converter';

function Pools({ 
  poolInstances, 
  instancesLoaded }) {
  const history = useHistory();
 
  localStorage.setItem('/pools', window.location.href)

  if(instancesLoaded === false){
    return(
    <div>  
      <Spinner animation="grow" variant="secondary" className="spinner" />
      <Spinner animation="grow" variant="secondary" className="spinner" />
      <Spinner animation="grow" variant="secondary" className="spinner" />
    </div> 
    )
  }
  return (
    <div>
      <Container style={{maxWidth: '75%', marginTop: '5%'}}>
        <Row className="pools-first-row">
        </Row>
        <Row className="pools-second-row">
          <Col>
            <table className="pools-table">
              <thead>
                <tr className="thead-row">
                  <th id="td-th">Pool</th>
                  <th>Total Supply</th>
                  <th>Your deposit</th>
                  <th>Your Pool Share</th>
                </tr>
              </thead>
              <tbody>
              { poolInstances.map(instance =>
                <tr onClick={() => {history.push(`pools/${instance.contract.options.address}`)}} key={instance.poolAddress}>
                  <td className="pool-name">
                    
                    {instance.poolName}
                  </td>
                  <td>{instance.supply}</td>
                  <td>{instance.userPoolBalance}</td>
                  <td>{NaNConverter(parseFloat(instance.userPoolBalance / instance.supply * 100).toFixed(2)) + '%'}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

const mapStateToProps = state => ({
    poolInstances: state.pool,
    instancesLoaded: state.isLoading.instancesLoaded
})

export default connect(mapStateToProps)(Pools);
