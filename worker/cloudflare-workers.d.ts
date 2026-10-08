// `cloudflare:workers` の型のうち、worker/form-quota-object.ts が使う分だけ
// （@cloudflare/workers-types を入れると Next の DOM の型とぶつかる）。
declare module "cloudflare:workers" {
  interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    deleteAll(): Promise<void>;
  }
  interface DurableObjectState {
    storage: DurableObjectStorage;
  }
  export class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState;
    protected env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }
}
