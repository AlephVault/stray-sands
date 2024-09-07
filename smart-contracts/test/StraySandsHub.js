const { expect } = require("chai");
const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const StraySandsHub = require("../ignition/modules/StraySandsHub");

/**
 * Fixture function to deploy a contract.
 * @returns {Promise<*>} The fixture data (async function).
 */
async function deployStraySandsHubFixture() {
    return await ignition.deploy(StraySandsHub);
}

describe("StraySandsHub", () => {
    /**
     * Here, we'll keep the contract being tested (of type: StraySandsHub).
     */
    let contract = null;

    /**
     * Here, we'll keep all the Tag elements being registered out of calls
     * to registerTag in a StraySandsHub contract.
     */
    let tags = {};

    /**
     * Here, we'll keep all the signers.
     */
    let signers = [];

    before(async () => {
        let { contract: contract_ } = await loadFixture(deployStraySandsHubFixture);
        contract = contract_;
        signers = await hre.ethers.getSigners();
    });

    async function processTags() {
        const events = await contract.queryFilter(contract.filters.Tag, -1);
        if (!events.length) return;
        events.forEach(({args: [hash, name]}) => {
            tags[hash] = name;
        })
    }

    it("must fail tag registration for non-owner addresses", async () => {
        // The non-owner cannot create a new tag.
        await expect(hre.common.send(contract, "registerTag", ["Gaming"], {account: 1})).to.be.revertedWithCustomError(
            contract, "OwnableUnauthorizedAccount"
        ).withArgs(signers[1]);
    });

    it("must succeed tag registration for owner addresses", async () => {
        // But the owner can (many times).

        await hre.common.send(contract, "registerTag", ["Games"]);
        await processTags();
        await hre.common.send(contract, "registerTag", ["Documents"]);
        await processTags();
        await hre.common.send(contract, "registerTag", ["Audio & Video"]);
        await processTags();
    });

    it("must not succeed registering empty or duplicate tags", async () => {
        // First, testing valid tag but duplicate: Games.
        await expect(hre.common.send(contract, "registerTag", ["Games"])).to.be.revertedWith(
            "StraySands: Tag already registered"
        );

        // Then, testing empty tags.
        await expect(hre.common.send(contract, "registerTag", [""])).to.be.revertedWith(
            "StraySands: Invalid tag"
        );
    });

    // registerTag(tag: string): void -- only the contract owner.
    // -- Putea si este método no lo invoca el owner del contrato.
    // -- Putea "StraySands: Invalid tag" si el tag es "".
    // -- Putea "StraySands: Tag already registered" si el hash del tag ya está registrado.
    // -- Emite Tag(hash=hashDelTag, tag=tag). Idealmente, siempre que queramos saber qué
    //    tags hay, enumeramos este evento manualmente.
    // getRelayURL(relayId: uint256): string.
    // getRelaySigningAddress(relayId: uint256): address.
    // getRelayTagsCount(relayId: uint256): uint256.
    // getRelayTag(relayId: uint256, index: uint256): bytes32.
    // registerRelay(name: string, url: string, signingAddress: uint256): void.
    //
    // setRelayMetadataField(relayId: uint256, fieldIndex: uint256 = [0:name, 1:description, 2:imageUrl], value: string) -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
    // setRelayUrl(relayId: uint256, url: string): void -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
    // setRelaySigningAddress(relayId: uint256, url: string): void -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
    // addRelayTag(relayId: uint256, tag: bytes32): void -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
    // removeRelayTag(relayId: uint256, tag: bytes32): vod -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
});