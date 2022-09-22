import React from "react";
import { FallbackProps } from "react-error-boundary";

export const Catch: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div style={{ color: "#fff" }}>
      <h1>Error!</h1>
      <pre>{error!.message}</pre>
      <button onClick={() => resetErrorBoundary()}>Continue</button>
      <button onClick={() => location.reload()}>Reload</button>
    </div>
  );
};