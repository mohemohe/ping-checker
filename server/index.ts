import path from "path";
import dayjs from "dayjs";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { middleware } from "@common-creation/fastify-decorators/middleware";
import { BaseController, registerRoutes, route } from "@common-creation/fastify-decorators/route";
import { MongoClient } from "mongodb";
import _ from "lodash";

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const dbName = process.env.MONGO_DB || "ping-checker";
if (!process.env.MONGO_URL) {
  throw new Error("invalid environment variable: 'MONGO_URL'");
}

const client = new MongoClient(process.env.MONGO_URL, {
  retryWrites: true,
});
const enableIndex = process.env.ENABLE_MONGO_INDEX === "true";

const cors = () => middleware((req, res, next) => {
  if (process.env.ALLOW_SERVER_CORS === "true") {
    res.header("Access-Control-Allow-Origin", "*");
  }
  next(req, res);
});

@route("/api/v1/results")
class ApiController extends BaseController {
  @cors()
  public static async get(req: FastifyRequest<{ Querystring: { start?: string; end?: string; target?: string; } }>, res: FastifyReply) {
    let { start, end, target } = req.query;

    let startDayjs: dayjs.Dayjs;
    let endDayjs: dayjs.Dayjs;
    if (!end) {
      endDayjs = dayjs();
    } else {
      const endNumber = parseInt(end, 10);
      if (!isNaN(endNumber)) {
        endDayjs = dayjs.unix(endNumber);
      } else {
        endDayjs = dayjs();
      }
    }
    if (!start) {
      startDayjs = dayjs();
    } else {
      const startNumber = parseInt(start, 10);
      if (!isNaN(startNumber)) {
        startDayjs = dayjs.unix(startNumber);
      } else {
        startDayjs = dayjs();
      }
    }

    let targetNumber = parseInt(target || "", 10);
    if (isNaN(targetNumber)) {
      targetNumber = 400;
    }

    const diff = Math.abs(startDayjs.diff(endDayjs, "seconds", false));
    const binSize = Math.round(diff / targetNumber);
    const dateTrunc = {
      date: "$createdAt",
      unit: "second",
      binSize,
    };

    req.log.debug(dateTrunc);

    const db = client.db(dbName);
    const collection = db.collection("results");
    const aggregateOption = enableIndex ? { hint: "timeseries" } : {};
    const aggregates = await collection.aggregate([
      { 
        $match: {
          createdAt: {
            $gte: startDayjs.toDate(),
            $lte: endDayjs.toDate(),
          },
        },
      },
      { 
        $group: {
          _id: {
            truncatedDate: {
              $dateTrunc: dateTrunc,
            },
            networkType: "$networkType",
          },
          packetLoss: {
            $avg: "$packetLoss",
          },
          latency: {
            $avg: "$latency",
          },
        }
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          createdAt: {
            $divide: [
              {
                $toLong: "$_id.truncatedDate"
              },
              1000,
            ],
          },
          packetLoss: 1,
          latency: 1,
          networkType: "$_id.networkType",
        },
      },
    ], aggregateOption).toArray();

    const results = _.groupBy(aggregates, "createdAt");

    req.log.debug(`data count: ${Object.keys(results).length}`);

    res.send({
      results,
    });
  }
}

async function main() {
  await client.connect();

  const server = Fastify({
    logger: {
      level: "trace",
    },
  });
  server.register(require("@fastify/static"), {
    root: path.resolve(__dirname, "public"),
    prefix: "/",
  })
  registerRoutes(server, [ApiController]);
  server.listen({
    host: "0.0.0.0",
    port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) || 8080 : 8080,
  });
}

main().catch(console.error);
