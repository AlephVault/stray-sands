// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./StraySandsHub.sol";

/**
 * This contract is the permissions manager for the
 * tokens in the StraySandsHub contract. The logic
 * can be described like this:
 *
 * 1. First, a token must exist. The check must be
 *    done against ownership of the token.
 * 2. Then, a role must be told.
 * 3. Finally, a user to assign/revoke that role.
 *
 * This will be used in other contracts.
 */
contract StraySandsAuthorization {
    /**
     * The hub contract.
     */
    address private hub;

    /**
     * The permissions scheme, like this for (relay, permission, user):
     * permissions[relayId][hub.ownerOf(relayId)][permission][user] === granted.
     */
    mapping(uint256 => mapping(address => mapping(bytes32 => mapping(address => bool)))) private permissions;

    constructor(address _hub) {
        require(_hub != address(0), "StraySandsAuthorization: Invalid hub address");
        hub = _hub;
    }

    /**
     * A modifier that restricts a method for the
     * owner of the token to perform these actions.
     */
    modifier onlyRelayOwner(uint256 relayId) {
        StraySandsHub(hub).checkTokenOwner(relayId);
        _;
    }

    /**
     * This event is triggered when a permission is granted
     * or revoked for a specific address.
     */
    event Permission(address indexed relayId, bytes32 indexed permission, address indexed user, bool granted);

    /**
     * Checks whether the permission is set for the current
     * owner of the relay, the relay itself, the role and
     * the target address.
     */
    function hasPermission(uint256 relayId, bytes32 permission, address user) public view returns (bool) {
        return permissions[relayId][StraySandsHub(hub).ownerOf(relayId)][permission][user];
    }

    // Management of permissions involves this structure:
    // [address tokenOwner][uint256 relayId][bytes32 role][address user] = (bool approved).
    // This scheme, leveraging the `tokenOwner`, serves so all the permissions are reset
    // (or not known) when the relay token changes owner. The new owner should manually
    // set all the permissions manually, by iterating the Permission(relayId, roleId, user)
    // event log.

    // Methods:
    // - setPermission(uint256 relayId, bytes32 role, address user, bool) onlyRelayOwner.
    // - hasPermission(uint256 relayId, bytes32 role, address user).
}
