const Bridge = artifacts.require("./Bridge.sol")
const ZamToken = artifacts.require("./ZamToken.sol")

contract("bridge contract", (accounts) => {
    let bridge, zamToken
    let amount = web3.utils.toWei("10", "ether")

    let signer, signerPrivateKey

    signer = accounts[9]
    signerPrivateKey = "0x4f6e63df95a919151313c501f6d3a63da0993b460cb943e4b2f03134cb21e98a"

    function toHex(str) {
        var hex = ''
        for( var i=0 ; i < str.length ; i++ )
            hex += ''+str.charCodeAt(i).toString(16)
        return hex
    }

    before(async() => {
        bridge = await Bridge.deployed()
        zamToken =  await ZamToken.deployed()
    })

    it("set signer", async() => {
        await bridge.setSigner(signer, {from: accounts[0]})
    })

    it('test lock method', async() => {
        await zamToken.approve(bridge.address, amount, {from: accounts[0]})
        let tx = await bridge.lock(amount)
    })

    it('test unlock method', async() => {
        let msg = 'I really did make this message'
        let signature = web3.eth.accounts.sign( '0x' + toHex(msg), signerPrivateKey)

        await bridge.unlock(amount, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})
    })
})