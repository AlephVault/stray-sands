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

    /**00000
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

    it("must return empty data for invalid tokens", async () => {
        expect(await hre.common.call(contract, "getRelayURL", [1])).to.equal("");
        expect(await hre.common.call(contract, "getRelaySigningAddress", [1])).to.equal("0x0000000000000000000000000000000000000000");
        expect(await hre.common.call(contract, "getRelayTagsCount", [1])).to.equal(0);
    });

    // registerRelay:
    // VALIDA el ownerOf(1) == address(0).
    // EMITE un evento Transfer(0, msg.sender, 1).
    // VALIDA el ownerOf(1) == msg.sender
    it("must fail registering a new relay with empty URL or empty address", async () => {
        // Case for empty URL.
        await expect(hre.common.send(
            contract, "registerRelay", ["My Awesome Relay", "", hre.common.getAddress(signers[10])]
        )).to.be.revertedWith("StraySands: Invalid relay URL");

        // Case for empty address.
        await expect(hre.common.send(
            contract, "registerRelay", ["My Awesome Relay", "https://www.example.org", "0x0000000000000000000000000000000000000000"]
        )).to.be.revertedWith("StraySands: Invalid relay address");
    });

    it("must succeed registering a new relay with non-empty URL and non-empty address (the name can be empty)", async () => {
        // 1. First, test the token does not exist.
        await expect(hre.common.call(contract, "ownerOf", [1])).to.be.revertedWithCustomError(
            contract, "ERC721NonexistentToken"
        ).withArgs(1);

        // 2. Then, create the relay (using account [2] as sender).
        const tx = await hre.common.send(contract, "registerRelay", [
            "My Awesome Relay", "https://www.example.org", hre.common.getAddress(signers[10])
        ], {account: 2});
        await tx.wait();

        // 3. Identify the transfer event properly.
        const events = await contract.queryFilter(contract.filters.Transfer, -1);
        expect(events.length).to.equal(1);
        const [from_, to, token] = events[0].args;
        expect(to).to.equal(hre.common.getAddress(signers[2]));
        expect(from_).to.equal("0x0000000000000000000000000000000000000000");
        expect(token).to.equal(1);

        // 4. Finally, test the token exists for the sender.
        expect(await hre.common.call(contract, "ownerOf", [1])).to.equal(hre.common.getAddress(signers[2]));
    });

    async function testAllData(tokenId, url, signingAddress, tagsCount, name, description, image) {
        expect(await hre.common.call(contract, "getRelayURL", [tokenId])).to.equal(url);
        expect(await hre.common.call(contract, "getRelaySigningAddress", [tokenId])).to.equal(signingAddress);
        expect(await hre.common.call(contract, "getRelayTagsCount", [tokenId])).to.equal(tagsCount);
        const response = await fetch(await hre.common.call(contract, "tokenURI", [tokenId]));
        const metadata = await response.json();
        expect(metadata.name).to.equal(name);
        expect(metadata.description).to.equal(description);
        expect(metadata.image).to.equal(image);
    }

    async function expectNonTokenOwnerIsRejected(promise) {
        await expect(promise).to.be.revertedWith("StraySands: Only the owner can perform this action");
    }

    it("must return non-empty data and initial metadata for token 1", async () => {
        await testAllData(
            1, "https://www.example.org", hre.common.getAddress(signers[10]), 0,
            "My Awesome Relay", "", ""
        );
    });

    it("must allow any basic metadata change, but only for the owner of the token (which is [2])", async () => {
        // Actually ANY string is allowed for these fields.

        // BUT NOT for the non-owner.
        await expectNonTokenOwnerIsRejected(hre.common.send(contract, "setRelayMetadataField", [
            1, 0, "My Seriously Awesome Relay"
        ]));

        // 1. Setting field: name.
        await hre.common.send(contract, "setRelayMetadataField", [
            1, 0, "My Seriously Awesome Relay"
        ], {account: 2});
        await testAllData(
            1, "https://www.example.org", hre.common.getAddress(signers[10]), 0,
            "My Seriously Awesome Relay", "", ""
        );

        // 1. Setting field: description.
        await hre.common.send(contract, "setRelayMetadataField", [
            1, 1, "This is a seriously awesome relay"
        ], {account: 2});
        await testAllData(
            1, "https://www.example.org", hre.common.getAddress(signers[10]), 0,
            "My Seriously Awesome Relay", "This is a seriously awesome relay", ""
        );

        // 1. Setting field: image.
        await hre.common.send(contract, "setRelayMetadataField", [
            1, 2, "https://www.example.org/image.png"
        ], {account: 2});
        await testAllData(
            1, "https://www.example.org", hre.common.getAddress(signers[10]), 0,
            "My Seriously Awesome Relay", "This is a seriously awesome relay",
            "https://www.example.org/image.png"
        );
    });

    it("must allow url change, but only for the owner of the token (which is [2])", async () => {
        // NOT for the non-owner.
        await expectNonTokenOwnerIsRejected(hre.common.send(contract, "setRelayUrl", [
            1, "https://www.example.org/alt"
        ]));

        await hre.common.send(contract, "setRelayUrl", [
            1, "https://www.example.org/alt"
        ], {account: 2});
        await testAllData(
            1, "https://www.example.org/alt", hre.common.getAddress(signers[10]), 0,
            "My Seriously Awesome Relay", "This is a seriously awesome relay",
            "https://www.example.org/image.png"
        );
    });

    it("must allow address change, but only for the owner of the token (which is [2])", async () => {
        // NOT for the non-owner.
        await expectNonTokenOwnerIsRejected(hre.common.send(contract, "setRelaySigningAddress", [
            1, hre.common.getAddress(signers[11])
        ]));

        await hre.common.send(contract, "setRelaySigningAddress", [
            1, hre.common.getAddress(signers[11])
        ], {account: 2});
        await testAllData(
            1, "https://www.example.org/alt", hre.common.getAddress(signers[11]), 0,
            "My Seriously Awesome Relay", "This is a seriously awesome relay",
            "https://www.example.org/image.png"
        );
    });
    // addRelayTag(relayId: uint256, tag: bytes32): void -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
    // removeRelayTag(relayId: uint256, tag: bytes32): vod -- only the token owner.
    // -- Putea si este método no lo invoca el owner del contrato.
});