module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  runner: "groups",
  modulePathIgnorePatterns: ["./dist"],
  setupFilesAfterEnv: ["jest-extended"]
};