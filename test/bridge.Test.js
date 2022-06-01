const SourceBridge = artifacts.require("./test/SourceBridge.sol")
const DestinationBridge = artifacts.require("./test/DestinationBridge.sol")
const ZamToken = artifacts.require("./ZamToken.sol")

contract("bridge contract", (accounts) => {
    let source, dest, token
    let srcXId
    const zamOwner = accounts[0]

    let signer, signerPrivateKey

    signer = accounts[9]
    signerPrivateKey = "0x1e3fa634e56fe2a88723f3e14e1dc8398da1d3bcffbc3b722c7a2a7c21dc4cc1"

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

        try {
            // use shorten `msg` data
            let shortMsg = '0x07f86015955e72b173fbf5d2aeadde0f52352a1f9787f9076bb4e21b5158dad300000000000000000000000000'
            await dest.unlock(shortMsg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})    
        } catch (e) {
            console.log('Case of short message: ', e.reason)
        }
        try {
            // use longer `msg` data
            let longerMsg = '0x07f86015955e72b173fbf5d2aeadde0f52352a1f9787f9076bb4e21b5158dad30000000000000000000000000000000000000000000000008ac7230489e80000000000000000000000000000084aa8e6d5e9149337c01a074651bda66e326a9f000000000000000000000000f5d57591e69ba47275c742dbaa65e4fb28c4c89c234234bac9AA8518B6BD3382F84E'
            await dest.unlock(longerMsg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})    
        } catch (e) {
            console.log('Case of longer message: ', e.reason)
        }        
        await dest.unlock(msg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})

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