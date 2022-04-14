const Bridge = artifacts.require("./Bridge.sol")
const ZamToken = artifacts.require("./ZamToken.sol")

contract("bridge contract", (accounts) => {
    let bridge, zamToken
    let amount = web3.utils.toWei("10", "ether")

    let signer, signerPrivateKey

    signer = accounts[9]
    signerPrivateKey = "0x6ce6882478bf9b3a372cf28f4cd0b97e47a2fe2c21013908421adc419a2bed72"

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
        let msg
        let srcXId = 100
        let sender = accounts[0]
        msg = web3.eth.abi.encodeParameters(['uint256', 'uint256', 'address'],[srcXId, amount, sender])

        let signature = web3.eth.accounts.sign( msg, signerPrivateKey)

        await bridge.unlock(msg, signature.messageHash, Number(signature.v), signature.r, signature.s, {from: accounts[0]})
    })
})