import path from "path"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const rules = [
  { test: /\.m?js$/, exclude: /node_modules/, loader: "babel-loader" },
  { test: /\.css$/i,
    use: [MiniCssExtractPlugin.loader, "css-loader"],
  },
  { test: /\.s[ac]ss$/i,
    use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
  },
]
const plugins = [
  new MiniCssExtractPlugin({
    filename: "site/hex.css",
  }),
]

export default (entry, outp)=> {
  const mode = process.env.NODE_ENV || "production"
  return {
    entry: entry,
    mode: mode,
    devtool: "source-map",
    output: {
      path: path.resolve(outp),
      filename: "site/hex.js",
    },
    module: { rules },
    resolve: {
      extensions: ['.*', '.js', '.mjs'],
      fallback: { "url": false },
    },
    resolveLoader: {
      modules: [resolve(__dirname, '..', 'node_modules'), 'node_modules'],
    },
    devServer: {
      static: {
        directory: path.resolve(outp),
      },
    },
    plugins,
  }
}
