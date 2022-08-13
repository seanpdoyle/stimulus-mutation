import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import { terser } from "rollup-plugin-terser"
import { version } from "./package.json"

const year = new Date().getFullYear()
const banner = `/*\nstimulus-mutation ${version}\nCopyright © ${year} thoughtbot\n */`

export default [
  {
    input: "src/index.js",
    output: [
      {
        name: "Stimulus",
        file: "dist/stimulus-mutation.umd.js",
        format: "umd",
        banner
      },
      {
        file: "dist/stimulus-mutation.js",
        format: "es",
        banner
      },
    ],
    context: "window",
    plugins: [
      resolve(),
      typescript()
    ]
  },
  {
    input: "src/index.js",
    output: {
      file: "dist/stimulus-mutation.min.js",
      format: "es",
      banner,
      sourcemap: true
    },
    context: "window",
    plugins: [
      resolve(),
      typescript(),
      terser({
        mangle: true,
        compress: true
      })
    ]
  }
]
