/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // Reescribe .js a .ts/.tsx
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
