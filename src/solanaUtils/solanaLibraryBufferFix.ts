import { Buffer } from "buffer"

if (typeof window !== "undefined" && typeof window.Buffer === "undefined") {
  window.Buffer = Buffer
}
