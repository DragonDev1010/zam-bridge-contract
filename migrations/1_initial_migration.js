const Migrations = artifacts.require("Migrations");
const Verifier = artifacts.require("Verifier")

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Verifier)
};
