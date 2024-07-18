import { defineContract } from "../smartContractHelpers/codegenImport";
import { btcBridgeRegistryV201 } from "./contract_xlink_btc-bridge-registry-v2-01"
import { btcPegInEndpointV201 } from "./contract_xlink_btc-peg-in-endpoint-v2-01"
import { btcPegOutEndpointV201 } from "./contract_xlink_btc-peg-out-endpoint-v2-01"
import { crossBridgeRegistryV201 } from "./contract_xlink_cross-bridge-registry-v2-01"
import { crossPegInEndpointV201 } from "./contract_xlink_cross-peg-in-endpoint-v2-01"
import { crossPegOutEndpointV201 } from "./contract_xlink_cross-peg-out-endpoint-v2-01"

export const xlinkContracts = defineContract({
...btcBridgeRegistryV201,
...btcPegInEndpointV201,
...btcPegOutEndpointV201,
...crossBridgeRegistryV201,
...crossPegInEndpointV201,
...crossPegOutEndpointV201
});

  