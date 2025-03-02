import test from "ava";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.development.local" });

const { NEXT_PUBLIC_accountId: accountId, NEXT_PUBLIC_contractId: contractId } =
  process.env;
import * as nearAPI from "near-api-js";

import {
  getAccount,
  contractView,
  contractCall,
  getDevAccountKeyPair,
} from "../utils/near-provider.js";

import { quote_hex, collateral } from "./sample.js";

// tests

// delete the contract account to clear storage state and re-run tests

test("delete, create contract account", async (t) => {
  const keyPair = getDevAccountKeyPair();

  try {
    const account = getAccount(contractId);
    await account.deleteAccount(accountId);
  } catch (e) {
    console.log("error deleteAccount", e);
  }

  try {
    const account = getAccount(accountId);
    await account.createAccount(
      contractId,
      keyPair.getPublicKey(),
      nearAPI.utils.format.parseNearAmount("10"),
    );
  } catch (e) {
    console.log("error createAccount", e);
  }
  t.pass();
});

test("deploy contract", async (t) => {
  const file = fs.readFileSync("./contract/target/near/contract.wasm");
  const account = getAccount(contractId);
  await account.deployContract(file);
  console.log("deployed bytes", file.byteLength);
  const balance = await account.getAccountBalance();
  console.log("contract balance", balance);

  t.pass();
});

test("init contract", async (t) => {
  await contractCall({
    contractId,
    methodName: "init",
    args: {
      owner_id: accountId,
    },
  });

  t.pass();
});

test("call register_worker with quote", async (t) => {
  const res = await contractCall({
    contractId,
    methodName: "register_worker",
    args: {
      quote_hex,
      collateral: JSON.stringify(collateral),
      checksum: "foo",
      codehash: "bar",
    },
  });

  console.log("was worker registered?", res);

  t.pass();
});

test("call is_worker_verified", async (t) => {
  // will throw if the worker was not registered
  await contractCall({
    contractId,
    methodName: "is_verified_by_codehash",
    args: {
      codehash: "bar",
    },
  });

  t.pass();
});

test("should fail: call is_worker_verified", async (t) => {
  // will throw if the worker was not registered
  try {
    await contractCall({
      contractId,
      methodName: "is_worker_verified",
      args: {
        codehash: "bar2",
      },
    });
  } catch (e) {
    console.log(
      "require! assertion failed?",
      /require! assertion failed/gim.test(JSON.stringify(e)),
    );
  }

  t.pass();
});

test("call get_worker", async (t) => {
  const res = await contractView({
    contractId,
    methodName: "get_worker",
    args: {
      account_id: accountId,
    },
  });

  console.log("worker", res);

  t.pass();
});

test("call approve_codehash", async (t) => {
  // will throw if the worker was not registered
  await contractCall({
    contractId,
    methodName: "approve_codehash",
    args: {
      codehash: "bar",
    },
  });

  t.pass();
});

test("call is_verified_by_approved_codehash", async (t) => {
  // will throw if the worker was not registered
  await contractCall({
    contractId,
    methodName: "is_verified_by_approved_codehash",
    args: {},
  });

  t.pass();
});
