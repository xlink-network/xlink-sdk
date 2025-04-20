import { defineContract } from "../smartContractHelpers/codegenImport";
import { btcPegInEndpointV207 } from "./contract_bro_btc-peg-in-endpoint-v2-07"
import { btcPegInEndpointV207Swap } from "./contract_bro_btc-peg-in-endpoint-v2-07-swap"
import { btcPegInEndpointV207Agg } from "./contract_bro_btc-peg-in-endpoint-v2-07-agg"
import { btcPegInEndpointV205Launchpad } from "./contract_bro_btc-peg-in-endpoint-v2-05-launchpad"
import { btcPegOutEndpointV201 } from "./contract_bro_btc-peg-out-endpoint-v2-01"
import { crossPegInEndpointV204 } from "./contract_bro_cross-peg-in-endpoint-v2-04"
import { crossPegInEndpointV204Swap } from "./contract_bro_cross-peg-in-endpoint-v2-04-swap"
import { crossPegOutEndpointV201 } from "./contract_bro_cross-peg-out-endpoint-v2-01"
import { crossPegOutEndpointV201Agg } from "./contract_bro_cross-peg-out-endpoint-v2-01-agg"
import { metaPegInEndpointV204 } from "./contract_bro_meta-peg-in-endpoint-v2-04"
import { metaPegInEndpointV206Swap } from "./contract_bro_meta-peg-in-endpoint-v2-06-swap"
import { metaPegInEndpointV206Agg } from "./contract_bro_meta-peg-in-endpoint-v2-06-agg"
import { metaPegOutEndpointV204 } from "./contract_bro_meta-peg-out-endpoint-v2-04"

export const broContracts = defineContract({
...btcPegInEndpointV207,
...btcPegInEndpointV207Swap,
...btcPegInEndpointV207Agg,
...btcPegInEndpointV205Launchpad,
...btcPegOutEndpointV201,
...crossPegInEndpointV204,
...crossPegInEndpointV204Swap,
...crossPegOutEndpointV201,
...crossPegOutEndpointV201Agg,
...metaPegInEndpointV204,
...metaPegInEndpointV206Swap,
...metaPegInEndpointV206Agg,
...metaPegOutEndpointV204
});

  