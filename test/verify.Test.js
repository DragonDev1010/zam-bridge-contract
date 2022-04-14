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
        let signerPrivateKey = "0xc5ddfd0eee47c457c81e436679f223cbab5c4e23d28558b44cd42b549a986af8"

        let msg = '100'
        let signature = web3.eth.accounts.sign( '0x' + toHex(msg), signerPrivateKey)

        let tx = await verifier.recoverAddr(signature.messageHash, Number(signature.v), signature.r, signature.s, msg)
        await verifier.recoverAddr(signature.messageHash, Number(signature.v), signature.r, signature.s, msg)
    })
})