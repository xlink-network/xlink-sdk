import { XLinkSDK } from "@xlink-network/xlink-sdk"
import { AlexSDK } from "alex-sdk"
import { FC } from "react"
import "./App.css"
import { SwapRouteSelector } from "./components/SwapRouteSelector"
import { QueryClient, QueryClientProvider } from "react-query"

const alex = new AlexSDK()
const xlink = new XLinkSDK()
const queryClient = new QueryClient()

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        <header className="app-header">
          <h1>XLink Cross-Chain Swap Demo</h1>
        </header>
        <main className="app-main">
          <div className="content-wrapper">
            <SwapRouteSelector alexSDK={alex} xlinkSDK={xlink} />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App
