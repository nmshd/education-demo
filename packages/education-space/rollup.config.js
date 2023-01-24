import livereload from "rollup-plugin-livereload";

export default {
  plugins: [livereload({ watch: "../server/public/", port: 35727 })],
  watch: {
    clearScreen: false
  }
};
