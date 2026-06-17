module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Lets us import app code as "#/..." instead of long relative paths.
      [
        'module-resolver',
        {
          alias: {
            '#': './src',
          },
        },
      ],
    ],
  }
}
