import { useEffect } from "react";

export const useDidMount = (func: Function) =>
  useEffect(() => {
    func();
  }, []);