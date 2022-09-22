import Logger from "../utils/logger";
import { action, observable } from "mobx";
import { SnackbarMessage, OptionsObject, SnackbarKey } from "notistack";
import LoadingStore from "./loading";

export enum State {
  IDLE,
  RUNNING,
  DONE,
  ERROR,
}

export default class Base {
  constructor() {
    this.state = State.IDLE;
  }

  @observable
  public state: State;

  @action.bound
  public setState(state: State) {
    Logger.verbose("BaseStore", "setState:", state);
    this.state = state;
    LoadingStore.setLoading(state === State.RUNNING);
  }

  @action.bound
  public resetState() {
    this.setState(State.IDLE);
  }

  protected get apiBaseUrl() {
    let baseUrl = import.meta.env.VITE_API_BASE_URL || "/api/";
    if (!baseUrl.endsWith("/")) {
      baseUrl = `${baseUrl}/`;
    }
    return baseUrl;
  }

  protected apiUrl(...path: string[]) {
    Logger.verbose("BaseStore", "path:", path);
    return this.apiBaseUrl + path.map((param) => param.replace(/\/$/, "")).join("/");
  }

  protected generateFetchHeader(withAuth = true, override?: any) {
    const baseHeader = {
      Accept: "application/json",
    };
    let result: any = { ...baseHeader };
    if (withAuth) {
      result = {
        ...result,
        Authorization: `Bearer ${localStorage.accessToken || sessionStorage.accessToken}`,
      };
    }
    if (override) {
      result = {
        ...result,
        ...override,
      };
    }

    return result;
  }

  protected get loading() {
    return LoadingStore.loading;
  }

  protected tryEnqueueSnackbar(message: SnackbarMessage, options?: OptionsObject): SnackbarKey | null {
    const func = (window as any).enqueueSnackbar;
    if (typeof func == "function") {
      return func(message, options) as SnackbarKey;
    }
    return null;
  }
}