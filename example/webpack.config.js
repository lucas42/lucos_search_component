import { URL } from 'url';
export default {
  entry: {
    example: './example/example.js',
  },
  output: {
    filename: 'built.js',
    path: new URL('.', import.meta.url).pathname,
  },
  mode: 'development',
};