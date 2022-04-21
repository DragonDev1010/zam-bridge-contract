// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DestinationBridge is Ownable {
    using SafeERC20 for IERC20;
    uint256 bridgeFee;
    address public signer;
    mapping(bytes32 => bool) public executedXId;
    mapping(bytes32 => bool) private usedMsgHash;
    mapping(address => bool) public bridgeTokens;
    
    uint256 private locked;

    event Locked(bytes32 transferId);
    event Unlocked(uint256 amount);

    function lock(address token_, uint256 amount) public {
        require(bridgeTokens[token_], 'Token is not registered in this bridge.');
        IERC20(token_).safeTransferFrom(msg.sender, address(this), amount);
        bytes32 transferId = keccak256(abi.encodePacked(msg.sender, amount, (locked*37), block.timestamp));
        locked++;
        emit Locked(transferId);
    }

    function unlock (bytes memory unlockRequest, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 xId = keccak256(abi.encodePacked(unlockRequest));
        require(!executedXId[xId], "This request was already executed.");
        require(!usedMsgHash[msgHash], 'The message signature hash was already used.');
        require(_isSigned(signer, msgHash, v, r, s), "failed to verify");

        uint256 srcXId;
        uint256 amount;
        address sender;
        address token_;
        ( srcXId, amount, sender, token_ ) = _parseABI(unlockRequest);
        IERC20(token_).safeTransfer(sender, amount*(100-bridgeFee)/100);
        executedXId[xId] = true;
        usedMsgHash[msgHash] = true;
    }

    function _parseABI (bytes memory request) private pure returns(uint256, uint256, address, address) {
        uint256 srcXId;
        uint256 amount;
        address sender;
        address token_;

        assembly {
            srcXId := mload(add(request, 0x20))
            amount := mload(add(request, 0x40))
            sender := mload(add(request, 0x60))
            token_ := mload(add(request, 0x80))
        }
        return (srcXId, amount, sender, token_);
    }

    function _isSigned(address _addr, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) private pure returns (bool) {
        return ecrecover(msgHash, v, r, s) == _addr;
    }

    function setSigner(address signer_) public onlyOwner {
        signer = signer_;
    }

    function setToken (address token_) public onlyOwner {
        require(!bridgeTokens[token_], 'It is already registered in our bridge.');
        require(token_ != address(0), 'Token address can not be zero.');
        bridgeTokens[token_] = true;
    }

    function setFee(uint256 fee_) public onlyOwner {
        bridgeFee = fee_;
    }

    function withdraw(address token) public onlyOwner {
        require(bridgeTokens[token], 'The token is not registered in this bridge.');
        uint256 amount = IERC20(token).balanceOf(address(this));
        require(amount > 0, 'This bridge does not have this token now.');
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}