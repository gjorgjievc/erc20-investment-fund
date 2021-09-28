// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IContractRegistry.sol";
import "./interfaces/IPoolFactory.sol";
import "./interfaces/IBaseContract.sol";

/// @title  ContractRegistry
/// @notice Address registry for all project contract addresses.
/// @dev    Addresses are registered as a mapping name --> address
contract ContractRegistry is Ownable, IContractRegistry {

    event LogRegistered(address indexed destination, bytes32 name);

    /// @notice registry name --> address map
    mapping(bytes32 => address) public registry;

    /// @notice Self-contract registration
    /// @dev    Called by the owner. The names and addresses needs to be of same length.
    /// @param  _destinations Array of addresses for the contracts
    function importContracts(address[] calldata _destinations) external onlyOwner {
        for (uint i = 0; i < _destinations.length; i++) {
            bytes32 name = IBaseContract(_destinations[i]).getName();
            registry[name] = _destinations[i];
            emit LogRegistered(_destinations[i], name);
        }
    }

    /// @notice Batch register of (name,address) pairs in the contract registry
    /// @dev    Called by the owner. The names and addresses needs to be of same length.
    /// @param  _names Array of names
    /// @param  _destinations Array of addresses for the contracts
    function importAddresses(bytes32[] calldata _names, address[] calldata _destinations) external onlyOwner {
        require(_names.length == _destinations.length, "ERR_INVALID_LENGTH");

        for (uint i = 0; i < _names.length; i++) {
            registry[_names[i]] = _destinations[i];
            emit LogRegistered(_destinations[i], _names[i]);
        }
    }

    /// @notice Gets a contract address by a given name
    /// @param  _bytes name in bytes
    /// @return contract address, address(0) if not found
    function getAddress(bytes32 _bytes) external override view returns (address) {
        return registry[_bytes];
    }

    function poolFactory() external override view returns (IPoolFactory) {
        return IPoolFactory(requireAndGetAddress("PoolFactory"));
    }

    /// @notice Gets a contract address by a given name
    /// @param  name name in bytes
    /// @return contract address, fails if not found
    function requireAndGetAddress(bytes32 name) public override view returns (address) {
        address _foundAddress = registry[name];
        require(_foundAddress != address(0), string(abi.encodePacked("Name not registered: ", name)));
        return _foundAddress;
    }

    /// @notice Gets a contract address by a given name as string
    /// @param  _name contract name
    /// @return contract address, address(0) if not found
    function getAddressByString(string memory _name) public view returns (address) {
        return registry[stringToBytes32(_name)];
    }


    /// @notice Converts string to bytes32
    /// @param  _string String to convert
    /// @return result bytes32
    function stringToBytes32(string memory _string) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(_string);

        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(_string, 32))
        }
    }

}