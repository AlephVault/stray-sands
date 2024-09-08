const { expect } = require("chai");
const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const StraySandsHub = require("../ignition/modules/StraySandsHub");
const StraySandsAuthorization = require("../ignition/modules/StraySandsAuthorization");

/**
 * Fixture function to deploy a contract.
 * @returns {Promise<*>} The fixture data (async function).
 */
async function deployStraySandsContractsFixture() {
    const hub = await ignition.deploy(StraySandsHub);
    const authorization = await ignition.deploy(StraySandsAuthorization);
    return { hub, authorization };
}

describe("StraySandsHub", () => {
    /**
     * Here, we'll keep the hub contract (of type: StraySandsHub).
     */
    let hub = null;

    /**
     * Here, we'll keep the authorization contract being tested (of type: StraySandsAuthorization).
     */
    let authorization = null;

    /**
     * Here, we'll keep all the signers.
     */
    let signers = [];

    before(async () => {
        let { hub: hub_, authorization: authorization_ } = await loadFixture(deployStraySandsContractsFixture);
        hub = hub_;
        authorization = authorization_;
        signers = await hre.ethers.getSigners();
    });

    // it("", async () => {
    //
    // });
});