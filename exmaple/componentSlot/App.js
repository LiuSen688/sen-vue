import { h } from "../../lib/sen-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    const foo = h(Foo, {}, { header: ({age}) => h("p", {}, "header " + age), footer: () => h("p", {}, "footer") });
    return h("div", {}, [app, foo]);
  },
  setup() {
    return {
      msg: "sen-vue-haha",
    };
  },
};
