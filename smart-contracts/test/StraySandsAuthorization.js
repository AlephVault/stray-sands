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
    const { contract: hub } = await ignition.deploy(StraySandsHub);
    const { contract: authorization } = await ignition.deploy(StraySandsAuthorization);
    return { hub, authorization };
}

describe("StraySandsAuthorization", () => {
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
            hub, "registerRelay", ["Relay #1", "https://relay1.example.org", hre.common.getAddress(signers[90])],
            {account: 0}
        );
        await hre.common.send(
            hub, "registerRelay", ["Relay #2", "https://relay2.example.org", hre.common.getAddress(signers[91])],
            {account: 1}
        );
    });

    it("must not allow changing permissions on a non-existing token", async () => {
        await expect(hre.common.send(authorization, "setPermission", [
            0, PERM_FOO, hre.common.getAddress(signers[80]), true
        ])).to.be.revertedWithCustomError(hub, "ERC721NonexistentToken").withArgs(0);
    });

    it("must not allow changing permission on a non-owned token", async () => {
        await expect(hre.common.send(authorization, "setPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80]), true
        ], {account: 0})).to.be.revertedWith("StraySands: Only the owner can perform this action");
    });

    it("must allow FOO permission set on owned token [2]", async () => {
        await (await hre.common.send(authorization, "setPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80]), true
        ], {account: 1})).wait();
        const events = await authorization.queryFilter(authorization.filters.Permission, -1);
        expect(events.length).to.equal(1);
        const {args: [relayId, permission, user, granted]} = events[0];
        expect(relayId).to.equal(2);
        expect(permission).to.equal(PERM_FOO);
        expect(user).to.equal(hre.common.getAddress(signers[80]));
        expect(granted).to.equal(true);
        await network.provider.send("evm_mine");
    });

    it("must allow, again, FOO permission set on owned token [2]", async () => {
        await (await hre.common.send(authorization, "setPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80]), true
        ], {account: 1})).wait();
        const events = await authorization.queryFilter(authorization.filters.Permission, -1);
        expect(events.length).to.equal(0);
        await network.provider.send("evm_mine");
    });

    it("must be allowed in token [2] to do FOO, but nothing else", async () => {
        expect(await hre.common.call(authorization, "hasPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80])
        ])).to.equal(true);
        expect(await hre.common.call(authorization, "hasPermission", [
            1, PERM_FOO, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            2, PERM_BAR, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            1, PERM_BAR, hre.common.getAddress(signers[80])
        ])).to.equal(false);
    });

    it("must allow FOO permission clear on owned token [2]", async () => {
        await (await hre.common.send(authorization, "setPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80]), false
        ], {account: 1})).wait();
        const events = await authorization.queryFilter(authorization.filters.Permission, -1);
        expect(events.length).to.equal(1);
        const {args: [relayId, permission, user, granted]} = events[0];
        expect(relayId).to.equal(2);
        expect(permission).to.equal(PERM_FOO);
        expect(user).to.equal(hre.common.getAddress(signers[80]));
        expect(granted).to.equal(false);
        await network.provider.send("evm_mine");
    });

    it("must allow, again, FOO permission clear on owned token [2]", async () => {
        await (await hre.common.send(authorization, "setPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80]), false
        ], {account: 1})).wait();
        const events = await authorization.queryFilter(authorization.filters.Permission, -1);
        expect(events.length).to.equal(0);
        await network.provider.send("evm_mine");
    });

    it("must not be allowed in token [2] to do FOO, and also nothing else", async () => {
        expect(await hre.common.call(authorization, "hasPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            1, PERM_FOO, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            2, PERM_BAR, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            1, PERM_BAR, hre.common.getAddress(signers[80])
        ])).to.equal(false);
    });

    it("must allow FOO permission set on owned token [2]", async () => {
        await (await hre.common.send(authorization, "setPermission", [
            1, PERM_FOO, hre.common.getAddress(signers[80]), true
        ], {account: 0})).wait();
        const events = await authorization.queryFilter(authorization.filters.Permission, -1);
        expect(events.length).to.equal(1);
        const {args: [relayId, permission, user, granted]} = events[0];
        expect(relayId).to.equal(1);
        expect(permission).to.equal(PERM_FOO);
        expect(user).to.equal(hre.common.getAddress(signers[80]));
        expect(granted).to.equal(true);
        await network.provider.send("evm_mine");
    });

    it("must be allowed in token [1] to do FOO, but nothing else", async () => {
        expect(await hre.common.call(authorization, "hasPermission", [
            2, PERM_FOO, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            1, PERM_FOO, hre.common.getAddress(signers[80])
        ])).to.equal(true);
        expect(await hre.common.call(authorization, "hasPermission", [
            2, PERM_BAR, hre.common.getAddress(signers[80])
        ])).to.equal(false);
        expect(await hre.common.call(authorization, "hasPermission", [
            1, PERM_BAR, hre.common.getAddress(signers[80])
        ])).to.equal(false);
    });
    // Tests to implement:
    // 9. Can set the same permission for the other token. It will emit an event.
    // 10. Now the user must be allowed in the OTHER token and not the main one. Also,
    //     with one permission but not the other one.
});