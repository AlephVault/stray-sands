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
    address public hub;

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
        StraySandsHub(hub).checkTokenOwner(msg.sender, relayId);
        _;
    }

    /**
     * This event is triggered when a permission is granted
     * or revoked for a specific address.
     */
    event Permission(uint256 indexed relayId, bytes32 indexed permission, address indexed user, bool granted);

    /**
     * Checks whether the permission is set for the current
     * owner of the relay, the relay itself, the role and
     * the target address.
     */
    function hasPermission(uint256 relayId, bytes32 permission, address user) public view returns (bool) {
        try StraySandsHub(hub).ownerOf(relayId) returns (address owner) {
            return permissions[relayId][owner][permission][user];
        } catch {
            return false;
        }
    }

    /**
     * Changes the grant status for a certain relayId and the
     * target permission for a given user.
     */
    function setPermission(
        uint256 relayId, bytes32 permission, address user, bool granted
    ) public onlyRelayOwner(relayId) {
        if (permissions[relayId][StraySandsHub(hub).ownerOf(relayId)][permission][user] != granted) {
            permissions[relayId][StraySandsHub(hub).ownerOf(relayId)][permission][user] = granted;
            emit Permission(relayId, permission, user, granted);
        }
    }
}
