import { h } from "../../lib/sen-mini-vue.esm.js";

export const App = {
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      // string
      // "hi, mini-vue"
      // array
      [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "sen-vue")]
    );
  },
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
