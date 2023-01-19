import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import svelte from "rollup-plugin-svelte";
import autoPreprocess from "svelte-preprocess";
import pkg from "./package.json";

const production = !process.env.ROLLUP_WATCH;

const { name } = pkg;

export default {
  input: "src/index.js",
  output: [
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
      name
    },
    {
      file: pkg.main,
      format: "umd",
      sourcemap: true,
      name
    }
  ],
  plugins: [
    svelte({
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
        // generate: production ? 'dom' : 'ssr',
        hydratable: true
      },
      preprocess: autoPreprocess({
        postcss: {
          plugins: [require("autoprefixer")()]
        }
      }),
      emitCss: false
    }),
    resolve(),
    commonjs(),
    typescript()
  ],
  watch: {
    clearScreen: false
  }
};
