// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CREATE2Factory {
    event ContractDeployed(
        address indexed deployer,
        address indexed deployedAddress,
        bytes32 salt,
        uint256 chainId
    );
    
    mapping(bytes32 => address) public deployedContracts;
    mapping(address => bytes32[]) public deployerSalts;
    
    function computeAddress(
        bytes32 salt,
        bytes32 bytecodeHash
    ) public view returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            bytecodeHash
        )))));
    }
    
    function deploy(
        bytes32 salt,
        bytes memory bytecode
    ) external returns (address deployedAddress) {
        require(bytecode.length > 0, "CREATE2Factory: empty bytecode");
        
        bytes32 saltWithSender = keccak256(abi.encodePacked(msg.sender, salt));
        
        assembly {
            deployedAddress := create2(0, add(bytecode, 0x20), mload(bytecode), saltWithSender)
        }
        
        require(deployedAddress != address(0), "CREATE2Factory: deployment failed");
        
        deployedContracts[saltWithSender] = deployedAddress;
        deployerSalts[msg.sender].push(saltWithSender);
        
        emit ContractDeployed(msg.sender, deployedAddress, saltWithSender, block.chainid);
        
        return deployedAddress;
    }
    
    function deployWithValue(
        bytes32 salt,
        bytes memory bytecode
    ) external payable returns (address deployedAddress) {
        require(bytecode.length > 0, "CREATE2Factory: empty bytecode");
        
        bytes32 saltWithSender = keccak256(abi.encodePacked(msg.sender, salt));
        
        assembly {
            deployedAddress := create2(callvalue(), add(bytecode, 0x20), mload(bytecode), saltWithSender)
        }
        
        require(deployedAddress != address(0), "CREATE2Factory: deployment failed");
        
        deployedContracts[saltWithSender] = deployedAddress;
        deployerSalts[msg.sender].push(saltWithSender);
        
        emit ContractDeployed(msg.sender, deployedAddress, saltWithSender, block.chainid);
        
        return deployedAddress;
    }
    
    function getDeploymentSalts(address deployer) external view returns (bytes32[] memory) {
        return deployerSalts[deployer];
    }
    
    function isDeployed(bytes32 salt) external view returns (bool) {
        return deployedContracts[salt] != address(0);
    }
    
    function getDeployedAddress(bytes32 salt) external view returns (address) {
        return deployedContracts[salt];
    }
}
