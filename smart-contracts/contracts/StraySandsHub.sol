// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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
contract StraySandsHub is ERC721 {
    /**
     * Feel free to setup your ERC721 name and symbol as you please
     * if you change your mind.
     */
    constructor() ERC721("Stray Sands Relays", "SSANDS") {}

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
        _requireOwned(tokenId);
        // TODO implement the actual retrieval here.
        name = "";
        description = "";
        image = "";
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
}
