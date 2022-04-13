// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Bridge is Ownable {
    IERC20 zamToken;
    address public signer;

    event Locked(bytes32 transferId);
    event Unlocked(uint256 amount);

    constructor(address tokenAddr) {
        zamToken = IERC20(tokenAddr);
    }

    function lock(uint256 amount) public {
        zamToken.transferFrom(msg.sender, address(this), amount);
        bytes32 transferId = keccak256(abi.encodePacked(msg.sender, amount));
        emit Locked(transferId);
    }

    function unlock(uint256 amount, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public {
        require(_isSigned(signer, msgHash, v, r, s), "failed to verify");
        zamToken.transfer(msg.sender, amount);
        emit Unlocked(amount);
    }

    function _isSigned(address _addr, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) private pure returns (bool) {
        return ecrecover(msgHash, v, r, s) == _addr;
    }

    function setSigner(address signer_) public onlyOwner {
        signer = signer_;
    }
}