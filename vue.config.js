module.exports = {
  publicPath: '',
  configureWebpack: (config) => {
    config.resolve.alias.tinyqueue =
      __dirname + '/node_modules/tinyqueue/tinyqueue.js';
  },
}