import { h } from "../../lib/sen-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    // 测试 props
    console.log("props", props);
    props.count++;
    console.log("props", props);

    // 测试 emits
    const emitAdd = () => {
      console.log("emmit add");
      emit("add",1,6);
      emit("add-foo")
    };

    return {
      emitAdd,
    };
  },
  render() {
    const btn = h("button", { onClick: this.emitAdd }, "emitAdd");
    const foo = h("p", {}, "foo22222");
    return h("div", {}, [btn, foo]);
  },
};
