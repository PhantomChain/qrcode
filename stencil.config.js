const sass = require('@stencil/sass');

exports.config = {
  namespace: 'phantomqrcode',
  bundles: [
    { components: ['phantom-qrcode'] }
  ],
  plugins: [
    sass()
  ]
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}
