import { defineContract } from "../smartContractHelpers/codegenImport";
import { btcPegInEndpointV205 } from "./contract_xlink_btc-peg-in-endpoint-v2-05"
import { btcPegOutEndpointV201 } from "./contract_xlink_btc-peg-out-endpoint-v2-01"
import { crossPegInEndpointV204 } from "./contract_xlink_cross-peg-in-endpoint-v2-04"
import { crossPegOutEndpointV201 } from "./contract_xlink_cross-peg-out-endpoint-v2-01"
import { metaPegInEndpointV204 } from "./contract_xlink_meta-peg-in-endpoint-v2-04"
import { metaPegOutEndpointV204 } from "./contract_xlink_meta-peg-out-endpoint-v2-04"

export const xlinkContracts = defineContract({
...btcPegInEndpointV205,
...btcPegOutEndpointV201,
...crossPegInEndpointV204,
...crossPegOutEndpointV201,
...metaPegInEndpointV204,
...metaPegOutEndpointV204
});

  