// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract KrakenProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant DATA_URL = "https://api.telegram.org/bot7397036003";

    function main(WebProof calldata webProof) public view returns (Proof memory, string memory) {
        Web memory web = webProof.verifyWithUrlPrefix(DATA_URL);

        string memory avgPrice = web.jsonGetString("result[0].channel_post.text");

        return (proof(), avgPrice);
    }
}
