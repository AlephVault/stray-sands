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
}
