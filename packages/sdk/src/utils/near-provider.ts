import * as nearAPI from "near-api-js";
const {
  Near,
  Account,
  KeyPair,
  keyStores,
  utils: { PublicKey },
} = nearAPI;

// These will be set by the server
let _contractId: string | undefined;
let _accountId: string | undefined;

export const getContractId = () => _contractId;
export const setContractId = (contractId: string): void => {
  _contractId = contractId;
};
const networkId = /testnet/gi.test(_contractId || "") ? "testnet" : "testnet";
const keyStore = new keyStores.InMemoryKeyStore();
const config =
  networkId === "testnet"
    ? {
        networkId,
        keyStore,
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://testnet.mynearwallet.com/",
        explorerUrl: "https://testnet.nearblocks.io",
      }
    : {
        networkId,
        keyStore,
        nodeUrl: "https://rpc.near.org",
        walletUrl: "https://mynearwallet.com/",
        explorerUrl: "https://nearblocks.io",
      };
const near = new Near(config);
const { connection } = near;
const { provider } = connection;
const gas = BigInt("300000000000000");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// helpers

export const setKey = (accountId: string, secretKey: string): void => {
  if (!accountId || !secretKey) return;
  _accountId = accountId;
  const keyPair = KeyPair.fromString(secretKey);
  keyStore.setKey(networkId, accountId, keyPair);
};

export const getDevAccountKeyPair = (secretKey: string): nearAPI.KeyPair => {
  const keyPair = KeyPair.fromString(secretKey);
  keyStore.setKey(networkId, _contractId || "", keyPair);
  return keyPair;
};

export const getImplicit = (pubKeyStr: string): string =>
  Buffer.from(PublicKey.from(pubKeyStr).data).toString("hex").toLowerCase();

export const getAccount = (id = _accountId): nearAPI.Account =>
  new Account(connection, id || "");

export const getBalance = async (
  accountId: string,
): Promise<{ available: string }> => {
  let balance = { available: "0" };
  try {
    const account = getAccount(accountId);
    balance = await account.getAccountBalance();
  } catch (e: any) {
    if (e.type === "AccountDoesNotExist") {
      console.log(e.type);
    } else {
      throw e;
    }
  }
  return balance;
};

// contract interactions

interface ViewFunctionParams {
  accountId?: string;
  contractId?: string;
  methodName: string;
  args?: Record<string, any>;
}

export const contractView = async <T = any>({
  accountId,
  contractId = _contractId,
  methodName,
  args = {},
}: ViewFunctionParams): Promise<T> => {
  if (!contractId) {
    throw new Error(
      "Contract ID is not set. Call setContractId first or provide a contractId parameter.",
    );
  }
  const account = getAccount(accountId);

  let res;
  try {
    res = await account.viewFunction({
      contractId: contractId || "",
      methodName,
      args,
      gas,
    });
  } catch (e: any) {
    if (/deserialize/gi.test(JSON.stringify(e))) {
      console.log(`Bad arguments to ${methodName} method`);
    }
    throw e;
  }
  return res;
};

interface FunctionCallParams {
  accountId?: string;
  contractId?: string;
  methodName: string;
  args: Record<string, any>;
}

export const contractCall = async <T = any>({
  accountId,
  contractId = _contractId,
  methodName,
  args,
}: FunctionCallParams): Promise<T> => {
  if (!contractId) {
    throw new Error(
      "Contract ID is not set. Call setContractId first or provide a contractId parameter.",
    );
  }
  const account = getAccount(accountId);
  let res;
  try {
    res = await account.functionCall({
      contractId: contractId || "",
      methodName,
      args,
      gas,
    });
  } catch (e: any) {
    console.log(e);
    if (/deserialize/gi.test(JSON.stringify(e))) {
      console.log(`Bad arguments to ${methodName} method`);
      return {} as T;
    }
    if (e.context?.transactionHash) {
      const maxPings = 30;
      let pings = 0;
      while (res.final_execution_status != "EXECUTED" && pings < maxPings) {
        // Sleep 1 second before next ping.
        await sleep(1000);
        // txStatus times out when waiting for 'EXECUTED'.
        // Instead we wait for an earlier status type, sleep between and keep pinging.
        res = await provider.txStatus(
          e.context.transactionHash,
          account.accountId,
          "INCLUDED",
        );
        pings += 1;
      }
      if (pings >= maxPings) {
        console.warn(
          `Request status polling exited before desired outcome.\n  Current status: ${res.final_execution_status}\nSignature Request will likley fail.`,
        );
      }
      return parseSuccessValue(res) as T;
    }
    throw e;
  }
  return parseSuccessValue(res) as T;
};

const parseSuccessValue = (transaction: any): any => {
  if (transaction.status.SuccessValue.length === 0) return;

  try {
    return JSON.parse(
      Buffer.from(transaction.status.SuccessValue, "base64").toString("ascii"),
    );
  } catch (e) {
    console.log(
      `Error parsing success value for transaction ${JSON.stringify(
        transaction,
      )}`,
    );
  }
};
