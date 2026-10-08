/**
 * @jest-environment node
 */

// 管理画面のセッション（lib/studio-session.ts）。2026-10-08 の監査の二つを止めておく:
//   - ログアウトの消去に Secure が付かず、本番の __Host- cookie が残っていた（監査 7）
//   - パスワードを変えても・アカウントを消しても、既存のセッションが 8 時間通った（監査 8）

export {};

type CookieOptions = Record<string, unknown>;
const jar = new Map<string, string>();
const setCalls: { name: string; value: string; options: CookieOptions }[] = [];

jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string, options: CookieOptions) => {
      setCalls.push({ name, value, options });
      if (options.maxAge === 0) jar.delete(name);
      else jar.set(name, value);
    },
  }),
  headers: async () => new Headers({ "user-agent": "Mozilla/5.0 test" }),
}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

type Session = typeof import("@/lib/studio-session");

function load(env: Record<string, string | undefined>): Session {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];
  let mod!: Session;
  jest.isolateModules(() => {
    mod = jest.requireActual<Session>("@/lib/studio-session");
  });
  process.env = saved;
  return mod;
}

const base = {
  STUDIO_EMAIL: "owner@example.com",
  STUDIO_PASSWORD: "first-password",
  STUDIO_PASSWORD_HASH: undefined,
  STUDIO_SESSION_SECRET: "test-secret-0123456789",
};

beforeEach(() => {
  jar.clear();
  setCalls.length = 0;
});

describe("セッション", () => {
  it("ログインしたアカウントのままなら通る", async () => {
    const s = load(base);
    await s.createSession("owner@example.com");
    expect(await s.verifySession()).toBe(true);
  });

  it("パスワードを変えたら、既存のセッションは通らない", async () => {
    await load(base).createSession("owner@example.com");
    const after = load({ ...base, STUDIO_PASSWORD: "second-password" });
    expect(await after.verifySession()).toBe(false);
  });

  it("アカウントを消したら、既存のセッションは通らない", async () => {
    await load({ ...base, STUDIO_EMAIL_2: "staff@example.com", STUDIO_PASSWORD_2: "staff-pass" }).createSession(
      "staff@example.com",
    );
    const after = load({ ...base, STUDIO_EMAIL_2: undefined, STUDIO_PASSWORD_2: undefined });
    expect(await after.verifySession()).toBe(false);
  });

  it("ログアウトは作ったときと同じ属性（Secure・Path=/）で消す", async () => {
    const s = load({ ...base, NODE_ENV: "production" });
    await s.createSession("owner@example.com");
    await s.destroySession();

    const [created, removed] = setCalls;
    expect(removed.name).toBe("__Host-miroku_studio");
    expect(removed.options).toMatchObject({ secure: true, path: "/", httpOnly: true, maxAge: 0 });
    expect(created.options).toMatchObject({ secure: true, path: "/", httpOnly: true });
  });
});
