import { h, ref } from "../../lib/sen-mini-vue.esm.js";

const prevChildren = "newChildren";
const nextChildren = [h("div", {}, "AAA"), h("div", {}, "BBB")];

export default {
  name: "TextToArray",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
  render() {
    const self = this;
    return self.isChange == true ? h("div", {}, nextChildren) : h("div", {}, prevChildren);
  },
};
