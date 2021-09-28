pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IAaveIncentivesController.sol";

interface IAToken is IERC20 {
    function getIncentivesController() external view returns (IAaveIncentivesController);
}