const ZamToken = artifacts.require("ZamToken")
const Bridge = artifacts.require("Bridge")

const SourceBridge = artifacts.require("SourceBridge")
const DestinationBridge = artifacts.require("DestinationBridge")

module.exports = async function (deployer) {
	await deployer.deploy(ZamToken)
	await deployer.deploy(Bridge, ZamToken.address)
	await deployer.deploy(SourceBridge)
	await deployer.deploy(DestinationBridge)
};
