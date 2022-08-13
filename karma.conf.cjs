const config = {
  basePath: ".",

  browsers: ["ChromeHeadless"],

  frameworks: ["qunit"],

  reporters: ["progress"],

  singleRun: true,

  autoWatch: false,

  files: [
    "dist/tests/index.js",
  ],

  preprocessors: {
    "dist/tests/**/*.js": ["webpack"],
  },

  webpack: {
    mode: "development",
    resolve: {
      extensions: [".js"]
    }
  },

  client: {
    clearContext: false,
    qunit: {
      showUI: true
    }
  },

  hostname: "0.0.0.0",

  captureTimeout: 180000,
  browserDisconnectTimeout: 180000,
  browserDisconnectTolerance: 3,
  browserNoActivityTimeout: 300000
}

module.exports = function (karmaConfig) {
  karmaConfig.set(config)
}
