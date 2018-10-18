var log = function log () {}
var error = function error () {}

// TODO: use a config to handle enablement

const LOG_ENABLED = true

const ERROR_ENABLED = true

if (LOG_ENABLED) {
  var log = function log () {
    for (let i=0; i < arguments.length; i++) {
      console.log(arguments[i])
    }
  }
}
if (ERROR_ENABLED) {
  var error = function error () {
    for (let i=0; i < arguments.length; i++) {
      console.error(arguments[i])
    }
  }
}

module.exports = {
  log: log,
  error: error
}
