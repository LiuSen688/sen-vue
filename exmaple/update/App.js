import { h, ref } from "../../lib/sen-mini-vue.esm.js";

export const App = {
  name: "App",

  setup() {
    const count = ref(0);
    const props = ref({ foo: "foo", bar: "bar" });
    console.log("props: ", props);
    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };
    const onChangePropsDemo3 = () => {
      props.value = { foo: "foo" };
    };
    const onClick = () => {
      count.value++;
    };
    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
  render() {
    return h("div", { id: "root", ...this.props }, [
      h("div", {}, "count: " + this.count),
      h("button", { onClick: this.onClick, propsKey: 123 }, "click"),
      h("button", { onClick: this.onChangePropsDemo1 }, "props 值改变了 修改"),
      h("button", { onClick: this.onChangePropsDemo2 }, "props 值改变了 删除"),
      h("button", { onClick: this.onChangePropsDemo3 }, "props 改变后有一个key没有了"),
    ]);
  },
};
