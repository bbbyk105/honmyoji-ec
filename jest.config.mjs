// Jest の設定。変換は next/jest（Next の SWC）に任せる —— babel を別に持たない。
// https://nextjs.org/docs/app/guides/testing/jest
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  // ビルドの書き出し（standalone の package.json）を拾うと名前が衝突する
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/.open-next/"],
};

export default createJestConfig(config);
