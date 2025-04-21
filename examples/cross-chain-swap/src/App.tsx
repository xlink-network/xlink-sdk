import { BroSDK } from "@brotocol-xyz/bro-sdk"
import { AlexSDK } from "alex-sdk"
import { FC } from "react"
import "./App.css"
import { SwapRouteSelector } from "./components/SwapRouteSelector"
import { QueryClient, QueryClientProvider } from "react-query"

const alex = new AlexSDK()
const sdk = new BroSDK()
const queryClient = new QueryClient()

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        <header className="app-header">
          <h1>Brotocol Cross-Chain Swap Demo</h1>
        </header>
        <main className="app-main">
          <div className="content-wrapper">
            <SwapRouteSelector alexSDK={alex} sdk={sdk} />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App
