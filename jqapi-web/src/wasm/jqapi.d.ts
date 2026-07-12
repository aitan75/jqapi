// Types for the vendored TeaVM (Phase 2b) CommonJS bridge output `jqapi.js`.
declare const jqapi: {
  run(json: string): string;
  main(args: string[]): void;
};
export default jqapi;
