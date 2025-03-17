import {
  KnownChainId,
  KnownRoute,
  StacksContractAddress,
  SwapRoute_WithExchangeRate,
  toSDKNumberOrUndefined,
  XLinkSDK,
} from "@xlink-network/xlink-sdk"
import { AlexSDK } from "alex-sdk"
import { FC, Fragment, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { getAvailableRoutes } from "../utils/getAvailableRoutes"
import { getSwapRoutesViaALEX } from "../utils/getSwapRoutesViaALEX"
import { getSwapRoutesViaEVMDEX } from "../utils/getSwapRoutesViaEVMDEX"
import { formatXLinkSDKChainName } from "../utils/formatXLinkSDKChainName"
import { useDebouncedValue } from "../hooks/useDebouncedValue"

const STORAGE_KEY = "xlink_matcha_api_key"

export const SwapRouteSelector: FC<{
  alexSDK: AlexSDK
  xlinkSDK: XLinkSDK
}> = ({ alexSDK, xlinkSDK }) => {
  const [matchaAPIKey, setMatchaAPIKey] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || ""
  })
  const [swapAmount, setSwapAmount] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<null | KnownRoute>(null)
  const [selectedSwapRoute, setSelectedSwapRoute] =
    useState<null | SwapRoute_WithExchangeRate>(null)

  const debouncedSwapAmount = useDebouncedValue(swapAmount, 500)
  const debouncedRoute = useDebouncedValue(selectedRoute, 500)
  const debouncedAPIKey = useDebouncedValue(matchaAPIKey, 500)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, matchaAPIKey)
  }, [matchaAPIKey])

  const availableRoutes = useQuery({
    queryKey: ["availableRoutes"],
    queryFn: () => getAvailableRoutes(xlinkSDK),
  })

  const alexRoutes = useQuery({
    enabled: !!debouncedRoute && !!debouncedSwapAmount,
    queryKey: [
      "alexRoutes",
      JSON.stringify(debouncedRoute),
      debouncedSwapAmount,
    ],
    queryFn: () => {
      if (debouncedRoute == null) {
        throw new Error("No route selected")
      }
      if (!isNumber(debouncedSwapAmount)) {
        throw new Error("No swap amount")
      }

      return getSwapRoutesViaALEX(
        {
          alexSDK: alexSDK,
          xlinkSDK: xlinkSDK,
        },
        {
          ...debouncedRoute,
          amount: toSDKNumberOrUndefined(Number(debouncedSwapAmount)),
          slippage: toSDKNumberOrUndefined(0.01),
        },
      )
    },
  })

  const evmDexRoutes = useQuery({
    enabled: !!debouncedRoute && !!debouncedSwapAmount && !!debouncedAPIKey,
    queryKey: [
      "evmDexRoutes",
      JSON.stringify(debouncedRoute),
      debouncedSwapAmount,
    ],
    queryFn: () => {
      if (debouncedRoute == null) {
        throw new Error("No route selected")
      }
      if (!debouncedAPIKey) {
        throw new Error("No matcha API key")
      }
      if (!isNumber(debouncedSwapAmount)) {
        throw new Error("No swap amount")
      }

      return getSwapRoutesViaEVMDEX(
        {
          xlinkSDK: xlinkSDK,
          matchaAPIKey: debouncedAPIKey,
        },
        {
          ...debouncedRoute,
          amount: toSDKNumberOrUndefined(Number(debouncedSwapAmount)),
          slippage: toSDKNumberOrUndefined(0.01),
        },
      )
    },
  })

  const bridgeInfo = useQuery({
    enabled: !!selectedRoute && !!selectedSwapRoute,
    queryKey: [
      "bridgeInfo",
      JSON.stringify(selectedRoute),
      JSON.stringify(selectedSwapRoute),
    ],
    queryFn: () => {
      if (selectedRoute == null) {
        throw new Error("No route selected")
      }
      if (selectedSwapRoute == null) {
        throw new Error("No swap route selected")
      }

      if (KnownChainId.isBitcoinChain(selectedRoute.fromChain)) {
        return xlinkSDK.bridgeInfoFromBitcoin({
          ...selectedRoute,
          swapRoute: selectedSwapRoute,
          amount: toSDKNumberOrUndefined(Number(swapAmount)),
        })
      }

      if (KnownChainId.isBRC20Chain(selectedRoute.fromChain)) {
        return xlinkSDK.bridgeInfoFromBRC20({
          ...selectedRoute,
          swapRoute: selectedSwapRoute,
          amount: toSDKNumberOrUndefined(Number(swapAmount)),
        })
      }

      if (KnownChainId.isRunesChain(selectedRoute.fromChain)) {
        return xlinkSDK.bridgeInfoFromRunes({
          ...selectedRoute,
          swapRoute: selectedSwapRoute,
          amount: toSDKNumberOrUndefined(Number(swapAmount)),
        })
      }

      if (KnownChainId.isEVMChain(selectedRoute.fromChain)) {
        throw new Error("EVM chain not support cross-chain swap yet")
      }

      if (KnownChainId.isStacksChain(selectedRoute.fromChain)) {
        throw new Error("Stacks chain not support cross-chain swap yet")
      }

      throw new Error("Unsupported chain: " + selectedRoute.fromChain)
    },
  })

  return (
    <div className="container">
      {availableRoutes.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading routes...</p>
        </div>
      )}

      <div className="section">
        <h2>Basic Information</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter 0x API Key"
            value={matchaAPIKey}
            onChange={e => setMatchaAPIKey(e.target.value)}
          />
        </div>
      </div>

      <div className="section">
        <h2>Swap Settings</h2>
        <div className="swap-group">
          <div className="route-select">
            <select
              value={selectedRoute ? JSON.stringify(selectedRoute) : ""}
              onChange={e =>
                setSelectedRoute(
                  e.target.value ? JSON.parse(e.target.value) : null,
                )
              }
              className="route-dropdown"
              disabled={availableRoutes.isLoading}
            >
              <option value="">Select Route</option>
              {availableRoutes.data?.map((route, index) => (
                <option key={index} value={JSON.stringify(route)}>
                  {route.fromTokenName} (
                  {formatXLinkSDKChainName(route.fromChain)}) →{" "}
                  {route.toTokenName} ({formatXLinkSDKChainName(route.toChain)})
                </option>
              ))}
            </select>
          </div>
          <div className="amount-input">
            <input
              type="number"
              placeholder="Enter swap amount"
              value={swapAmount}
              onChange={e => setSwapAmount(e.target.value)}
              className="amount-field"
              disabled={availableRoutes.isLoading}
            />
          </div>
        </div>
      </div>

      {selectedRoute && (
        <div className="section">
          <h2>Swap Routes</h2>

          <div className="routes-section">
            <h3>via ALEX</h3>
            {alexRoutes.isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading ALEX routes...</p>
              </div>
            ) : alexRoutes.data?.type === "success" ? (
              <div className="routes-grid">
                {alexRoutes.data.swapRoutes.map((route, index) => (
                  <div
                    key={index}
                    className={`route-card ${selectedSwapRoute === route ? "selected" : ""}`}
                    onClick={() => setSelectedSwapRoute(route)}
                  >
                    <p>
                      <StacksTokenName address={route.fromTokenAddress} />
                      {route.swapPools.map((p, index) => (
                        <Fragment key={index}>
                          &nbsp;→&nbsp;
                          <StacksTokenName address={p.toTokenAddress} />
                        </Fragment>
                      ))}
                    </p>
                    <p>Exchange Rate: {route.composedExchangeRate}</p>
                    <p>Minimum Receive: {route.minimumAmountsToReceive}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-routes">No ALEX routes available</p>
            )}
          </div>

          <div className="routes-section">
            <h3>via EVM DEX</h3>
            {evmDexRoutes.isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading EVM DEX routes...</p>
              </div>
            ) : evmDexRoutes.data?.type === "success" ? (
              <div className="routes-grid">
                {evmDexRoutes.data.swapRoutes.map((route, index) => (
                  <div
                    key={index}
                    className={`route-card ${selectedSwapRoute === route ? "selected" : ""}`}
                    onClick={() => setSelectedSwapRoute(route)}
                  >
                    <p>Route {index + 1}</p>
                    <p>Chain: {route.evmChain}</p>
                    <p>Exchange Rate: {route.composedExchangeRate}</p>
                    <p>Minimum Receive: {route.minimumAmountsToReceive}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-routes">No EVM DEX routes available</p>
            )}
          </div>
        </div>
      )}

      <div className="section">
        <h2>Bridge Information</h2>
        {selectedSwapRoute && (
          <>
            {bridgeInfo.isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading bridge information...</p>
              </div>
            ) : (
              bridgeInfo.data && (
                <div className="bridge-info">
                  <pre>{JSON.stringify(bridgeInfo.data, null, 2)}</pre>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

const StacksTokenName: FC<{
  address: StacksContractAddress
}> = ({ address }) => {
  return (
    <abbr title={`${address.deployerAddress}.${address.contractName}`}>
      {address.contractName}
    </abbr>
  )
}

const isNumber = (value: string): value is `${number}` => {
  if (value === "") return false
  const num = Number(value)
  return !isNaN(num) && isFinite(num) && num > 0
}
