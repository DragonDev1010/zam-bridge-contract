// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Verifier {
    mapping(bytes32 => bool) done;
    function recoverAddr(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s, bytes memory testmsg) public returns (address) {
        bytes32 h = keccak256(testmsg);
        require(!done[h], "already done");
        done[h] = true;
        return ecrecover(msgHash, v, r, s);
    }
    
    function isSigned(address _addr, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public pure returns (bool) {

        return ecrecover(msgHash, v, r, s) == _addr;
    }
}