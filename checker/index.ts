import path from "path";
import ping from "ping";
import { MongoClient } from "mongodb";

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const targetAddr = process.env.TARGET_ADDR || "1.1.1.1";
const networkType = process.env.NETWORK_TYPE || "不明";
const useIpv6 = !!process.env.USE_IPV6;
const dbName = process.env.MONGO_DB || "ping-checker";
const enableIndex = process.env.ENABLE_MONGO_INDEX === "true";

if (!process.env.MONGO_URL) {
  throw new Error("invalid environment variable: 'MONGO_URL'");
}
const client = new MongoClient(process.env.MONGO_URL, {
  retryWrites: true,
});

async function main() {
  await client.connect();

  const db = client.db(dbName);
  const ok = (await db.listCollections().toArray()).find((collection) => collection.name === "results");
  if (!ok) {
    await db.createCollection("results", {
      timeseries: {
        timeField: "createdAt",
        granularity: "seconds",
      }
    });
  }
  const collection = db.collection("results");

  const existsIndex = await collection.indexExists("timeseries");
  if (enableIndex && !existsIndex) {
    await collection.createIndex({ createdAt: 1 }, {
      name: "timeseries",
      background: true,
    });
  } else if (!enableIndex && existsIndex) {
    collection.dropIndex("timeseries");
  }

  setInterval(async () => {
    const now = new Date();
    const result = await ping.promise.probe(targetAddr, {
      timeout: 1,
      extra: ["-c", "1"],
      v6: useIpv6,
    });

    const doc  = {
      ok: result.alive,
      targetAddr,
      networkType,
      packetLoss: parseFloat(result.packetLoss),
      latency: result.time === "unknown" ? null : result.time,
      createdAt: now,
    };
    collection.insertOne(doc);

    if (process.env.DISABLE_CHECKER_LOG === "true") {
      return;
    }
    console.log(JSON.stringify(doc));
  }, 1000);
}

main().catch(console.error);

