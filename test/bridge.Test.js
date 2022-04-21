const SourceBridge = artifacts.require("./test/SourceBridge.sol")
const DestinationBridge = artifacts.require("./test/DestinationBridge.sol")
const ZamToken = artifacts.require("./ZamToken.sol")

contract("bridge contract", (accounts) => {
    let source, dest, token
    let srcXId
    const zamOwner = accounts[0]

    let signer, signerPrivateKey

    signer = accounts[9]
    signerPrivateKey = "0xe02cea5344c2b39003b78ad6e38345c5928e256756dd49e5cecedfbb092da8a7"

    function getNewXId(s) {
        let tail = s.substring(29, 34)
        s = s.replace(tail, '12345')
        let mid = s.substring(16, 21)
        s = s.replace(mid, 'abcde')
        let head = s.substring(2, 7)
        s = s.replace(head, '97531')
        return s
    }

    before(async() => {
        source = await SourceBridge.deployed()
        dest = await DestinationBridge.deployed()
        token = await ZamToken.deployed()
    })

    it('transfer token to destination for unlocking', async() => {
        let amount = web3.utils.toWei('1000', 'ether')
        await token.transfer(dest.address, amount, {from: zamOwner})
    })

    it("set signer", async() => {
        await source.setSigner(signer, {from: accounts[0]})
        await dest.setSigner(signer, {from: accounts[0]})
    })

    it('register token in bridge', async() => {
        // register token in source bridge
        await source.setToken(token.address)
        // register token in destination bridge
        await dest.setToken(token.address)
    })

    it('lock token on source chain', async() => {
        let destBalance = await token.balanceOf(dest.address)
        let lockAmount = web3.utils.toWei('10', 'ether')
        
        let sourceRegistered = await source.bridgeTokens.call(token.address)
        let destRegistered = await dest.bridgeTokens.call(token.address)
        
        // check if token is registered in source and destination chain
        if ( sourceRegistered && destRegistered ) {
            // check if destination bridge wallet has enough token for unlocking
            if(destBalance >= lockAmount) {
                // approve token to source bridge
                await token.approve(source.address, lockAmount, {from: accounts[0]})
                // trigger lock() method on source chain
                srcXId = await source.lock(token.address, lockAmount)
                srcXId = srcXId.logs[0].args.transferId
            } else {
                console.error('Destination bridge does not have enough token.')
            }
        } else {
            console.error('token is not yet registered in source or destination bridge')
        }
    })

    it('unlock token on destination chain', async() => {
        let sender = accounts[0]

        let unlockedAmount = web3.utils.toWei('10', 'ether')
        let msg = web3.eth.abi.encodeParameters(['uint256', 'uint256', 'address', 'address'],[srcXId, unlockedAmount, sender, token.address])
        let signature = web3.eth.accounts.sign( msg, signerPrivateKey)
        await dest.unlock(msg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})

        console.log(srcXId)
        console.log(getNewXId(srcXId))
        try {
            // duplicate signature
            msg = web3.eth.abi.encodeParameters(['uint256', 'uint256', 'address', 'address'],[getNewXId(srcXId), unlockedAmount, sender, token.address])
            await dest.unlock(msg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})
        } catch (error) {
            console.log("\x1b[31m", 'The message signature hash was already used.')
        }        
    })

    it('try lock/unlock again same parameter', async() => {
        console.log('try lock/unlock again same parameter')
        let lockAmount = web3.utils.toWei('10', 'ether')
        await token.approve(source.address, lockAmount, {from: accounts[0]})
        // trigger lock() method on source chain
        srcXId = await source.lock(token.address, lockAmount)
        srcXId = srcXId.logs[0].args.transferId
        console.log(srcXId)
        let sender = accounts[0]

        let unlockedAmount = web3.utils.toWei('10', 'ether')
        let msg = web3.eth.abi.encodeParameters(['uint256', 'uint256', 'address', 'address'],[srcXId, unlockedAmount, sender, token.address])
        let signature = web3.eth.accounts.sign( msg, signerPrivateKey)
        await dest.unlock(msg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})
    })

    it('withdraw from source chain', async() => {
        await source.withdraw(token.address, {from: accounts[0]})
    })
})