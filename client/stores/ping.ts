import dayjs from "dayjs";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import Logger from "../utils/logger";
import Base, { State } from "./base";

class PingStore extends Base {
  @observable
  public results: {
    [createdAt: string]: {
      networkType: string;
      latency: number;
      packetLoss: number;
      createdAt: number;
    }[],
  };

  constructor() {
    super();
    makeObservable(this);

    this.results = {};
  }

  @action
  public async fetch(start?: number, end?: number) {
    Logger.verbose("PingStore", "start:", start);
    Logger.verbose("PingStore", "end:", end);

    this.setState(State.RUNNING);
    try {
      let url = this.apiUrl("v1/results");

      if (start || end) {
        const params = new URLSearchParams();
        if (start) {
          params.append("start", start.toString());
        }
        if (end) {
          params.append("end", end.toString());
        }
        url += `?${params.toString()}`
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error();
      }
      const { results } = await res.json();
      this.results = results;
      return this.setState(State.DONE);
    } catch (e) {
      this.tryEnqueueSnackbar("ping結果の取得に失敗しました");

      return this.setState(State.ERROR);
    }
  }

  @computed
  public get latencyData() {
    const keys: string[] = [];
    const data: any[] = [];

    Object.keys(toJS(this.results)).sort().forEach((createdAt) => {
      const result = this.results[createdAt];

      result.map((r) => r.networkType).forEach((type) => {
        if (!keys.includes(type)) {
          keys.push(type);
        }
      });
      data.push({
        createdAt: dayjs.unix(result[0].createdAt).format("YYYY/MM/DD HH:mm:ss"),
        ...result.reduce((obj, result) => {
          obj[result.networkType] = result.latency;
          return obj;
        }, {} as any),
      })
    })

    Logger.debug("PingStore", "latency", "keys:", keys);
    Logger.debug("PingStore", "latency", "data:", data);

    return {
      keys,
      data,
    };
  }

  @computed
  public get packetLossData() {
    const keys: string[] = [];
    const data: any[] = [];

    Object.keys(toJS(this.results)).sort().forEach((createdAt) => {
      const result = this.results[createdAt];

      result.map((r) => r.networkType).forEach((type) => {
        if (!keys.includes(type)) {
          keys.push(type);
        }
      });
      data.push({
        createdAt: dayjs.unix(result[0].createdAt).format("YYYY/MM/DD HH:mm:ss"),
        ...result.reduce((obj, result) => {
          obj[result.networkType] = result.packetLoss;
          return obj;
        }, {} as any),
      })
    })

    Logger.debug("PingStore", "packet loss", "keys:", keys);
    Logger.debug("PingStore", "packet loss", "data:", data);

    return {
      keys,
      data,
    };
  }
}

export default new PingStore();