import { defineContract } from "../smartContractHelpers/codegenImport";
import { btcPegInEndpointV203 } from "./contract_xlink_btc-peg-in-endpoint-v2-03"
import { btcPegOutEndpointV201 } from "./contract_xlink_btc-peg-out-endpoint-v2-01"
import { crossPegInEndpointV203 } from "./contract_xlink_cross-peg-in-endpoint-v2-03"
import { crossPegOutEndpointV201 } from "./contract_xlink_cross-peg-out-endpoint-v2-01"

export const xlinkContracts = defineContract({
...btcPegInEndpointV203,
...btcPegOutEndpointV201,
...crossPegInEndpointV203,
...crossPegOutEndpointV201
});

  