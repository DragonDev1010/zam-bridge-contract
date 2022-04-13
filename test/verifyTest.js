const Verifier = artifacts.require("./Verifier.sol")
contract("Verify contract", (accounts) => {
    let verifier

    function toHex(str) {
        var hex = ''
        for( var i=0 ; i < str.length ; i++ )
            hex += ''+str.charCodeAt(i).toString(16)
        return hex
    }

    before(async() => {
        verifier = await Verifier.deployed()
    })

    it("recover address", async() => {
        let msg = 'I really did make this message'
        let signature = web3.eth.accounts.sign( '0x' + toHex(msg), "0x28498b1f43cc296820bb38e4010d7dfe4e6812acddc1b1a8cf96ea3ceaadd506")
        console.log(signature)

        let tx = await verifier.recoverAddr(signature.messageHash, Number(signature.v), signature.r, signature.s)
        console.log(tx)
    })
})