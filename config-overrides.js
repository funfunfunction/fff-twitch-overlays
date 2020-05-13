const { alias } = require('react-app-rewire-alias')

// eslint-disable-next-line no-undef
module.exports = function override(config) {

  alias({
    '@functions': 'functions',
  })(config)

  return config
}