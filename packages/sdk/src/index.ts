export {
  TappdClient,
  getImplicit,
  setKey,
  getDevAccountKeyPair,
  getAccount,
  getBalance,
  contractView,
  contractCall,
  networkId,
  parseNearAmount,
  formatNearAmount,
  deriveWorkerAccount,
  registerWorker,
  generateAddress,
  SearchMode,
  twitter,
} from "@neardefi/shade-agent-js";

// Keep exporting the local shade agent for now, we'll update its internals next
export * from "./utils/shade-agent.js";

// We might still need collateral utils if not present in the main SDK
export * from "./utils/collateral.js";
