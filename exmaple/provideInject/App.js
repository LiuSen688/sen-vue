import { h, provide, inject } from "../../lib/sen-mini-vue.esm.js";

export const Provider = {
  name: "Provider",
  setup(props, { emit }) {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
  },
};

export const ProviderTwo = {
  name: "ProviderTwo",
  setup(props, { emit }) {
    provide("foo", "fooTwo");
    const foo = inject("foo");
    return {
      foo,
    };
  },
  render() {
    return h("div", {}, [h("p", {}, `ProviderTwo : ${this.foo}`), h(Consumer)]);
  },
};

export const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    return {
      foo,
      bar,
    };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo} - ${this.bar}`);
  },
};
