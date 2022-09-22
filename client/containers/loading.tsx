import { css } from "@emotion/react";
import React from "react";
import { inject, observer } from "mobx-react";
import { CircularProgress } from "@mui/material";
import LoadingStore from "../stores/loading";

interface IProps {
  LoadingStore?: typeof LoadingStore;
}

const styles = {
  root: css({
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20, 20, 33, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 1100,
  }),
};

export const Loading = inject("LoadingStore")(
  observer((props: IProps) => {
    if (!props.LoadingStore!.loading) {
      return <></>;
    }

    return (
      <div css={styles.root}>
        <CircularProgress size={64} />
      </div>
    );
  }),
);