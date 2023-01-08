import { h } from "../../lib/sen-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click");
        },
      },
      // string
      // "hi, " + this.msg
      // array
      [h("p", { class: "red" }, "hi, " + this.msg), h(Foo, { count: 11 })]
    );
  },
  setup() {
    return {
      msg: "sen-vue-haha",
    };
  },
};

// export const App = {
//   name: "App",
//   render() {
//     // emit
//     return h("div", {}, [
//       h("div", {}, "App"),
//       h(Foo, {
//         onAdd(a,b) {
//           console.log("onAdd",a,b);
//         },
//         onAddFoo(){
//           console.log("onAddFoo");
//         }
//       }),
//     ]);
//   },
//   setup() {
//     return {
//       msg: "sen-vue-haha",
//     };
//   },
// };
