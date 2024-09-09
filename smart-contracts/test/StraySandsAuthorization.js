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

    /**
     * A sample permission: A permission over feature FOO.
     */
    const PERM_FOO = hre.common.keccak256("Can do Foo");

    /**
     * A sample permission: A permission over feature BAR.
     */
    const PERM_BAR = hre.common.keccak256("Can do Bar");

    before(async () => {
        let { hub: hub_, authorization: authorization_ } = await loadFixture(deployStraySandsContractsFixture);
        hub = hub_;
        authorization = authorization_;
        signers = await hre.ethers.getSigners();

        await hre.common.send(
            hub_, "registerRelay", ["Relay #1", "https://relay1.example.org", hre.common.getAddress(signers[90])],
            {account: 0}
        );
        await hre.common.send(
            hub_, "registerRelay", ["Relay #2", "https://relay2.example.org", hre.common.getAddress(signers[91])],
            {account: 1}
        );
    });

    // Tests to implement:
    // 1. Cannot change permission on a non-existing token.
    // 2. Cannot change permission on a non-owned-by-sender token (e.g. #2 with account 0).
    // 3. Can set a permission on an owned-by-sender token. It will emit an event.
    // 4. Can set the same permission again to same user. It will NOT emit an event now.
    // 5. The user must be allowed in that token but for that permission.
    //    NOT in the other token and NOT in the same token but other permission.
    // 6. Can revoke that permission. It will emit an event.
    // 7. Can revoke the same permission. It will NOT emit an event now.
    // 8. Now, the user must not be allowed in that token / for that permission.
    // 9. Can set the same permission for the other token. It will emit an event.
    // 10. Now the user must be allowed in the OTHER token and not the main one. Also,
    //     with one permission but not the other one.
});