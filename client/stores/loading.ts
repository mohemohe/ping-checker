import Logger from "../utils/logger";
import { action, computed, makeObservable, observable } from "mobx";

class LoadingStore {
  @observable
  public _loading: boolean;

  @observable
  public _lock: boolean;

  constructor() {
    makeObservable(this);

    this._loading = false;
    this._lock = false;
  }

  @action
  public setLoading(loading: boolean) {
    Logger.verbose("LoadingStore", "setLoading:", loading);
    this._loading = loading;
  }

  @action
  public lockLoading() {
    Logger.verbose("LoadingStore", "lock loading");
    this._lock = true;
  }

  @action
  public unlockLoading() {
    Logger.verbose("LoadingStore", "unlock loading");
    this._lock = false;
  }

  @computed
  public get loading() {
    return this._lock || this._loading;
  }
}

export default new LoadingStore();