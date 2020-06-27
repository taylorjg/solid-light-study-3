/* eslint-env node */

const { NODE_ENV } = process.env

const maybePurge = NODE_ENV === 'production'
  ? {
    purge: [
      './src/**/*.html',
      './src/**/*.js'
    ]
  }
  : undefined

module.exports = {
  ...maybePurge
}
