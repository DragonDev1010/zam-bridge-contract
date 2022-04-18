const SourceBridge = artifacts.require("./test/SourceBridge.sol")
const DestinationBridge = artifacts.require("./test/DestinationBridge.sol")

const usdcABI = require('./usdcABI.json')
const usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const usdcHolder = "0xcffad3200574698b78f32232aa9d63eabd290703"

contract("bridge contract by forking mainnet", (accounts) => {
    let source, dest
    let token // $USDT token of mainnet
    let srcXId

    let signer, signerPrivateKey

    signer = accounts[9]
    signerPrivateKey = "0xcee001c1de3ce5b8a289d605520a70406c9ad39efd52dffff20270c993a9e836"

    before(async() => {
        source = await SourceBridge.deployed()
        dest = await DestinationBridge.deployed()
        token = new web3.eth.Contract(usdcABI, usdcAddr)
    })

    it('transfer token to destination for unlocking', async() => {
        let amount = web3.utils.toWei('1000', 'mwei')
        await token.methods.transfer(dest.address, amount).send({from: usdcHolder})
    })

    it("set signer", async() => {
        await source.setSigner(signer, {from: accounts[0]})
        await dest.setSigner(signer, {from: accounts[0]})
    })

    it('register token in bridge', async() => {
        // register token in source bridge
        await source.setToken(usdcAddr)
        // register token in destination bridge
        await dest.setToken(usdcAddr)
    })

    it('lock token on source chain', async() => {
        let destBalance = await token.methods.balanceOf(dest.address).call()
        let lockAmount = web3.utils.toWei('10', 'mwei')
        
        let sourceRegistered = await source.bridgeTokens.call(usdcAddr)
        let destRegistered = await dest.bridgeTokens.call(usdcAddr)
        
        // check if token is registered in source and destination chain
        if ( sourceRegistered && destRegistered ) {
            // check if destination bridge wallet has enough token for unlocking
            if(destBalance >= lockAmount) {
                // approve token to source bridge
                await token.methods.approve(source.address, lockAmount).send({from: usdcHolder})
                // trigger lock() method on source chain
                srcXId = await source.lock(usdcAddr, lockAmount, {from: usdcHolder})
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
        let unlockedAmount = web3.utils.toWei('10', 'mwei')
        let msg = web3.eth.abi.encodeParameters(['uint256', 'uint256', 'address', 'address'],[srcXId, unlockedAmount, sender, usdcAddr])
        
        let signature = web3.eth.accounts.sign( msg, signerPrivateKey)

        await dest.unlock(msg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})
    })
})