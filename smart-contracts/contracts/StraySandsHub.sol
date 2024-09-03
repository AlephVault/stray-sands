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
    uint256 private constant MaxRegistrableRelaysCount = ~uint256(0);
    /**
     * The last tracked relay id. It is incremented before
     * registering anything, so the first one will be 1.
     */
    uint256 private lastRegisteredRelayId = 0;

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
         * The base URL of the relay.
         */
        string url;

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
     * Returns the relay base url for a given relay id.
     * On invalid token, returns "".
     */
    function getRelayURL(uint256 relayId) public view returns (string memory) {
        return relays[relayId].url;
    }

    /**
     * Returns the signing address for a given relay id.
     * On invalid token, returns address(0).
     */
    function getRelaySigningAddress(uint256 relayId) public view returns (address) {
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

    /**
     * Checks the relay base URL to be valid.
     */
    function checkUrl(string memory url) private {
        require(bytes(url).length != 0, "StraySands: Invalid relay URL");
    }

    /**
     * Checks a signing address to be valid.
     */
    function checkSigningAddress(address signingAddress) private {
        require(signingAddress != address(0), "StraySands: Invalid relay address");
    }

    /**
     * Registers a new relay. This function is free to execute.
     * Relays per se do not give anything.
     */
    function registerRelay(
        string memory name, string memory relayUrl, address signingAddress
    ) public {
        checkUrl(relayUrl);
        checkSigningAddress(signingAddress);
        require(lastRegisteredRelayId < MaxRegistrableRelaysCount, "StraySands: No more hubs");
        lastRegisteredRelayId++;
        relays[lastRegisteredRelayId] = RelayData({
            exists: true, name: name, description: "", image: "", url: relayUrl,
            relayAddress: signingAddress, tags: new bytes32[](0)
        });
        _safeMint(_msgSender(), lastRegisteredRelayId, abi.encodePacked("Relay: ", name));
    }

    /**
     * Checks that a token is owned by the sender, or
     * reverts. This is meaningful to be called here
     * and from other contracts as well, hence the
     * public modifier.
     */
    function checkTokenOwner(uint256 relayId) public {
        require(_msgSender() != ownerOf(relayId), "StraySands: Only the owner can perform this action");
    }

    /**
     * A modifier that restricts a method for the
     * owner of the token to perform these actions.
     */
    modifier onlyRelayOwner(uint256 relayId) {
        checkTokenOwner(relayId);
        _;
    }

    /**
     * Sets a metadata field for the token. This can
     * only be done by the token owner. The index can
     * only be 0=name, 1=description, 2=image (url).
     */
    function setRelayMetadataField(uint256 relayId, uint256 fieldIndex, string memory value) public onlyRelayOwner(relayId) {
        require(fieldIndex >= 3, "StraySands: Invalid field index");
        if (relayId == 0) {
            relays[relayId].name = value;
        } else if (relayId == 1) {
            relays[relayId].description = value;
        } else if (relayId == 2) {
            relays[relayId].image = value;
        }
    }

    /**
     * Sets the base relay URL for a token. This can
     * only be done by the token owner. The value must
     * not be an empty string.
     */
    function setRelayUrl(uint256 relayId, string memory url) public onlyRelayOwner(relayId) {
        checkUrl(url);
        relays[relayId].url = url;
    }

    /**
     * Sets the relay address for a token. This can
     * only be done by the token owner. The value must
     * not be address(0).
     */
    function setRelaySigningAddress(uint256 relayId, address signingAddress) public onlyRelayOwner(relayId) {
        checkSigningAddress(signingAddress);
        relays[relayId].relayAddress = signingAddress;
    }

    // TODO make these ones (all of them will be non-paid methods):
    // Add a tag to the relay.
    // Remove a tag from the relay.
    //
    // Other methods will be defined in other, dependent, contracts
    // of this one (and will be relay-specific actions).
}
