require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");
require('hardhat-contract-sizer');
require('hardhat-common-tools');
require('hardhat-enquirer-plus');
require('hardhat-servers');
require('hardhat-blueprints');
require('hardhat-method-prompts');
require('hardhat-ignition-deploy-everything');
require('hardhat-openzeppelin-common-blueprints');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
};
