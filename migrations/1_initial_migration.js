const Verifier = artifacts.require("Verifier")
const ZamToken = artifacts.require("ZamToken")
const Bridge = artifacts.require("Bridge")

module.exports = async function (deployer) {
	await deployer.deploy(Verifier)
	await deployer.deploy(ZamToken)
	await deployer.deploy(Bridge, ZamToken.address)
};
