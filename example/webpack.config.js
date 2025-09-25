import { URL } from 'url';
export default {
  entry: {
    example: './example/example.js',
  },
  output: {
    filename: 'built.js',
    path: new URL('.', import.meta.url).pathname,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["css-loader"],
      },
    ],
  },
  mode: 'development',
};