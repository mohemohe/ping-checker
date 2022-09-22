import path from "path";
import dayjs from "dayjs";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
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

@route("/api/v1/results")
class ApiController extends BaseController {
  public static async get(req: FastifyRequest<{ Querystring: { start?: number; end?: number; } }>, res: FastifyReply) {
    let { start, end } = req.query;
    if (!end) {
      end = dayjs().unix();
    }
    if (!start) {
      start = dayjs.unix(end).add(-3, "hours").unix();
    }

    let startDayJs = dayjs.unix(start);
    let endDayJs = dayjs.unix(end);

    let dateTrunc;
    if (Math.abs(startDayJs.diff(endDayJs, "hour", true)) <= 1.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "second",
        binSize: 2,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "hour", true)) <= 3.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "second",
        binSize: 20,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "hour", true)) <= 6.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "minute",
        binSize: 2,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "days", true)) <= 1.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "minute",
        binSize: 20,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "days", true)) <= 3.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "hour",
        binSize: 2,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "days", true)) <= 6.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "hour",
        binSize: 6,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "month", true)) <= 1.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "day",
        binSize: 1,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "year", true)) <= 3.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "month",
        binSize: 1,
      };
    } else if (Math.abs(startDayJs.diff(endDayJs, "year", true)) <= 6.0) {
      dateTrunc = {
        date: "$createdAt",
        unit: "month",
        binSize: 2,
      };
    } else {
      dateTrunc = {
        date: "$createdAt",
        unit: "year",
        binSize: 1,
      };
    }

    req.log.debug(dateTrunc);

    const db = client.db(dbName);
    const collection = db.collection("results");
    const aggregates = await collection.aggregate([
      { 
        $match: {
          createdAt: {
            $gte: dayjs.unix(start).toDate(),
            $lte: dayjs.unix(end).toDate(),
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
    ]).toArray();

    const results = _.groupBy(aggregates, "createdAt");

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
