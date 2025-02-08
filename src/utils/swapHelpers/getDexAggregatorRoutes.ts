import { readContract } from "viem/actions"
import { ERC20Abi } from "../../evmUtils/contractAbi/ERC20Abi"
import { evmChainIdFromKnownChainId } from "../../evmUtils/evmClients"
import { getEVMTokenContractInfo } from "../../evmUtils/xlinkContractHelpers"
import { EVMAddress, evmNativeCurrencyAddress } from "../../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../../xlinkSdkUtils/types.internal"
import { uniqBy } from "../arrayHelpers"
import { BigNumber } from "../BigNumber"
import { isNotNull } from "../typeHelpers"
import { KnownChainId, KnownTokenId } from "../types/knownIds"

export interface DexAggregatorRoute {
  provider: "IceCreamSwap"
  evmChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toToken: KnownTokenId.EVMToken
  fromAmount: BigNumber
  toAmount: BigNumber
  slippage: BigNumber
}

export async function getDexAggregatorRoutes(
  sdkContext: SDKGlobalContext,
  info: {
    routes: {
      evmChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.EVMToken
      amount: BigNumber
      slippage: BigNumber
    }[]
  },
): Promise<DexAggregatorRoute[]> {
  const uniqPossibleRoutes = uniqBy(
    r => `${r.evmChain}:${r.fromToken}:${r.toToken}:${r.amount}:${r.slippage}`,
    info.routes,
  )

  const queryableRoutes = await Promise.all(
    uniqPossibleRoutes.map(r => getQueryableRoutes(sdkContext, r)),
  ).then(res => res.filter(isNotNull))

  return fetchIceScreamSwapPossibleRoutes({
    possibleRoutes: queryableRoutes,
  })
}

interface QueryableRoute {
  chain: {
    chain: KnownChainId.EVMChain
    chainId: bigint
  }
  fromEVMToken: {
    token: KnownTokenId.EVMToken
    address: EVMAddress
    decimals: number
  }
  toEVMToken: {
    token: KnownTokenId.EVMToken
    address: EVMAddress
    decimals: number
  }
  amount: BigNumber
  slippage: BigNumber
}

async function getQueryableRoutes(
  sdkContext: SDKGlobalContext,
  info: {
    evmChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.EVMToken
    amount: BigNumber
    slippage: BigNumber
  },
): Promise<undefined | QueryableRoute> {
  const [chainId, fromEVMToken, toEVMToken] = await Promise.all([
    evmChainIdFromKnownChainId(info.evmChain),
    getEVMTokenContractInfo(sdkContext, info.evmChain, info.fromToken),
    getEVMTokenContractInfo(sdkContext, info.evmChain, info.toToken),
  ])
  if (
    chainId == null ||
    fromEVMToken == null ||
    fromEVMToken.tokenContractAddress === evmNativeCurrencyAddress ||
    toEVMToken == null ||
    toEVMToken.tokenContractAddress === evmNativeCurrencyAddress
  ) {
    return
  }

  const client = Object.values(sdkContext.evm.viemClients).find(
    c => c.chain?.id === Number(chainId),
  )
  if (client == null) return

  const [fromTokenDecimals, toTokenDecimals] = await Promise.all([
    readContract(client, {
      abi: ERC20Abi,
      address: fromEVMToken.tokenContractAddress,
      functionName: "decimals",
    }),
    readContract(client, {
      abi: ERC20Abi,
      address: toEVMToken.tokenContractAddress,
      functionName: "decimals",
    }),
  ])

  return {
    chain: {
      chain: info.evmChain,
      chainId: chainId,
    },
    fromEVMToken: {
      token: info.fromToken,
      address: fromEVMToken.tokenContractAddress,
      decimals: fromTokenDecimals,
    },
    toEVMToken: {
      token: info.toToken,
      address: toEVMToken.tokenContractAddress,
      decimals: toTokenDecimals,
    },
    amount: info.amount,
    slippage: info.slippage,
  }
}

type FetchRoutesImpl = (info: {
  possibleRoutes: QueryableRoute[]
}) => Promise<DexAggregatorRoute[]>

const fetchIceScreamSwapPossibleRoutes: FetchRoutesImpl = async info => {
  const res: Awaited<ReturnType<FetchRoutesImpl>> = []
  for (const route of info.possibleRoutes) {
    res.push(...(await fetchIceScreamSwapPossibleRoutesImpl(route)))
  }
  return res
}

const fetchIceScreamSwapPossibleRoutesImpl = async (
  info: QueryableRoute,
): ReturnType<FetchRoutesImpl> => {
  const querystring = new URLSearchParams({
    src: info.fromEVMToken.address,
    dst: info.toEVMToken.address,
    amount: String(
      BigNumber.toBigInt(
        { roundingMode: BigNumber.roundDown },
        BigNumber.rightMoveDecimals(info.fromEVMToken.decimals, info.amount),
      ),
    ),
    slippage: BigNumber.toString(info.slippage),
  })

  const fetchUrl = `https://aggregator.icecreamswap.com/${String(
    info.chain.chainId,
  )}?${querystring.toString()}`

  const resp = await fetch(fetchUrl)
  const respText = await resp.text()

  let respData: MockData
  try {
    respData = JSON.parse(respText)
  } catch (e) {
    return []
  }

  if (respData.toAmount === 0) return []

  return [
    {
      provider: "IceCreamSwap",
      evmChain: info.chain.chain,
      fromToken: info.fromEVMToken.token,
      toToken: info.toEVMToken.token,
      fromAmount: info.amount,
      toAmount: BigNumber.leftMoveDecimals(
        info.toEVMToken.decimals,
        respData.toAmount,
      ),
      slippage: info.slippage,
    },
  ]
}
type MockData = typeof mockData
const mockData = {
  swaps: [
    {
      amount_in: 166666666666666660000,
      amount_out: 6634209547,
      hops: 2,
      route: [
        {
          pool: "0xb2cc224c1c9feE385f8ad6a55b4d94E92359DC59",
          token_in: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          token_out: "0x4200000000000000000000000000000000000006",
        },
        {
          pool: "0x70aCDF2Ad0bf2402C957154f944c19Ef4e1cbAE1",
          token_in: "0x4200000000000000000000000000000000000006",
          token_out: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        },
      ],
    },
    {
      amount_in: 166666666666666660000,
      amount_out: 2698983972,
      hops: 1,
      route: [
        {
          pool: "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef",
          token_in: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          token_out: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        },
      ],
    },
    {
      amount_in: 166666666666666660000,
      amount_out: 2442353520,
      hops: 3,
      route: [
        {
          pool: "0xd0b53D9277642d899DF5C87A3966A349A798F224",
          token_in: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          token_out: "0x4200000000000000000000000000000000000006",
        },
        {
          pool: "0xE31c372a7Af875b3B5E0F3713B17ef51556da667",
          token_in: "0x4200000000000000000000000000000000000006",
          token_out: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
        },
        {
          pool: "0xb909F567c5c2Bb1A4271349708CC4637D7318b4A",
          token_in: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
          token_out: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        },
      ],
    },
  ],
  toAmount: 19354990505,
  tx: {
    data: "0x...",
    from: "0xbB7899696049C3A820A56CADa04aEF5BccbB3b54",
    to: "0xD810A437e334B9C3660C18b38fB3C01000B91DD3",
    value: 0,
  },
}
