// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Bridge is Ownable {
    IERC20 token;
    address public signer;
    mapping(bytes32 => bool) public executedXId;

    event Locked(bytes32 transferId);
    event Unlocked(uint256 amount);

    constructor(address tokenAddr) {
        token = IERC20(tokenAddr);
    }

    function lock(uint256 amount) public {
        token.transferFrom(msg.sender, address(this), amount);
        bytes32 transferId = keccak256(abi.encodePacked(msg.sender, amount));
        emit Locked(transferId);
    }

    function unlock (bytes memory unlockRequest, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 xId = keccak256(abi.encodePacked(unlockRequest));
        require(!executedXId[xId], "This request was already executed.");
        require(_isSigned(signer, msgHash, v, r, s), "failed to verify");

        uint256 srcXId;
        uint256 amount;
        address sender;
        ( srcXId, amount, sender ) = _parseABI(unlockRequest);
        token.transfer(msg.sender, amount);
        executedXId[xId] = true;
    }

    function _parseABI (bytes memory request) private pure returns(uint256, uint256, address) {
        uint256 srcXId;
        uint256 amount;
        address sender;

        assembly {
            srcXId := mload(add(request, 0x20))
            amount := mload(add(request, 0x40))
            sender := mload(add(request, 0x60))
        }
        return (srcXId, amount, sender);
    }

    function _isSigned(address _addr, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) private pure returns (bool) {
        return ecrecover(msgHash, v, r, s) == _addr;
    }

    function setSigner(address signer_) public onlyOwner {
        signer = signer_;
    }
}