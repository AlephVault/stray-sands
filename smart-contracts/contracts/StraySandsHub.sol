// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * This is a non-fungible token contract which is related
 * to an owner.
 *
 * Feel free to edit these notes accordingly, but after
 * reading these notes first:
 *
 * Your contract should define a way to mint tokens, and
 * optionally a way to burn tokens.
 */
contract StraySandsHub is ERC721, Ownable {
    /**
     * Each relay will have its own data.
     */
    struct RelayData {
        /**
         * This flag is true for any existing relay record.
         */
        bool exists;

        /**
         * The name of the relay. This is a very visual one.
         * Examples are: "Tidal Flare" or "Academia Blockchain".
         */
        string name;

        /**
         * An arbitrary description for the hub. Examples are:
         * "Main DragonShark games repository" or "The storage
         * for the main Academia Blockchain contents".
         */
        string description;

        /**
         * An image for the relay. The image must be a URL, and
         * can be "" or "about:blank", or any valid URL, being
         * it "http:", "ipfs:" or "data:".
         */
        string image;

        /**
         * The URL of the owned resource's redemption.
         */
        string redemptionUrl;

        /**
         * The address that will be assigned to the relay. This
         * one must be obtained. Any operation the relay wants
         * to do in-chain will be done with THIS address, and
         * not with the address of the token's owner.
         */
        address relayAddress;

        /**
         * The tags for this relay. This can be changed later
         * and it is NOT binding but hints what kind of contents
         * will it serve. This can be changed later and will not
         * attempt to bind which service can be provided, which
         * strongly implies the OLD contents here as well, but
         * just a hint for the users for the current state of the
         * relay's contents or trend.
         */
        bytes32[] tags;
    }

    /**
     * The registered relays.
     */
    mapping(uint256 => RelayData) public relays;

    /**
     * This mapping tracks the existing tags.
     * It will not have a public accessor (the
     * client apps must enumerate the Tag event
     * to list the existing tags).
     */
    mapping(bytes32 => string) private tags;

    /**
     * This event tracks when a tag is created.
     * Users should enumerate tags from here.
     */
    event Tag(bytes32 hash, string tag);

    /**
     * Feel free to setup your ERC721 name and symbol as you please
     * if you change your mind.
     */
    constructor() ERC721("Stray Sands Relays", "SSANDS") Ownable(msg.sender) {}

    /**
     * Implement your own logic to mint tokens by invoking _safeMint
     * at some point inside one of your methods. The invocation must
     * be like one of these:
     *     _safeMint(account, tokenId)
     *     _safeMint(account, tokenId, "someBinaryData")
     *
     * Also, you can implement your own logic to burn those tokens.
     * The syntax is like: _burn(account, tokenId).
     *
     * Don't allow those operations without prior clear rules.
     */

    /**
     * Retrieves the metadata of the token.
     */
    function _getTokenMetadata(uint256 tokenId) internal view returns (
        string memory name, string memory description, string memory image
    ) {
        require(relays[tokenId].exists, "StraySands: Invalid token");
        RelayData storage data = relays[tokenId];
        name = data.name;
        description = data.description;
        image = data.image;
    }

    /**
     * Retrieves a JSON with the metadata of the token.
     * See https://eips.ethereum.org/EIPS/eip-721 for more details.
     */
    function tokenURI(uint256 tokenId) public override view returns (string memory) {
        (string memory name, string memory description, string memory image) = _getTokenMetadata(tokenId);

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(abi.encodePacked(
           '{"name": "', name, '", "description": "', description, '", "image": "', image, '"}'
        ))));
    }

    /**
     * Registers a new tag. Only the owner can do this.
     */
    function registerTag(string memory tag) public onlyOwner {
        bytes memory tagBytes = bytes(tag);
        require(tagBytes.length != 0, "StraySands: Invalid tag");
        bytes32 tagHash = keccak256(tagBytes);
        require(bytes(tags[tagHash]).length == 0, "StraySands: Tag already registered");
        tags[tagHash] = tag;
        emit Tag(tagHash, tag);
    }

    /**
     * Returns the redemption url for a given relay id.
     * On invalid token, returns "".
     */
    function getRelayRedemptionURL(uint256 relayId) public view returns (string memory) {
        return relays[relayId].redemptionUrl;
    }

    /**
     * Returns the signing address for a given relay id.
     * On invalid token, returns address(0).
     */
    function getRelayRedemptionSigningAddress(uint256 relayId) public view returns (address) {
        return relays[relayId].relayAddress;
    }

    /**
     * Returns the count of tags for a given relay id.
     * On invalid token, returns 0.
     */
    function getRelayTagsCount(uint256 relayId) public view returns (uint256) {
        return relays[relayId].tags.length;
    }

    /**
     * Returns a given tag by index from a given relay id.
     * If invalid token or index, returns 0;
     */
    function getRelayTag(uint256 relayId, uint256 index) public view returns (bytes32) {
        bytes32[] storage tags = relays[relayId].tags;
        if (tags.length >= index) {
            return bytes32(0);
        } else {
            return tags[index];
        }
    }

    // TODO make these ones (all of them will be non-paid methods):
    // Register a relay.
    // Change a relay's name, description, or image.
    // Change a relay's redemption URL.
    // Change a relay's signing address.
    // Add a tag to the relay.
    // Remove a tag from the relay.
    //
    // Other methods will be defined in other, dependent, contracts
    // of this one (and will be relay-specific actions).
}
