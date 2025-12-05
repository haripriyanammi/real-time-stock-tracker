//tells the typescript that the key is in string
declare namespace NodeJS {
  interface ProcessEnv {
    ABLY_API_KEY: string;
  }
}
