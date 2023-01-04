import { h, renderSlots } from "../../lib/sen-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    return {};
  },
  render() {
    const age = 18;
    const foo = h("p", {}, "foo22222");
    console.log("slots", this.$slots);
    return h("div", {}, [renderSlots(this.$slots, "header",{age}), foo, renderSlots(this.$slots, "footer")]);
  },
};
