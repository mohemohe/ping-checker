/// <reference types="vite/client" />

interface ImportMetaEnv {
  [index: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}