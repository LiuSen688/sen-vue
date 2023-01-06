import { h, ref } from "../../lib/sen-mini-vue.esm.js";

// 1.左侧的对比

// const prevChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
//   h("div", { key: "C" }, "CCC")
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "AAA"),
//   h("div", { key: "B" }, "BBB"),
//   h("div", { key: "D" }, "DDD"),
//   h("div", { key: "E" }, "EEE"),
// ];

// 2. 右侧的对比
// a (b,c)
// d e (b,c)
// const prevChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
//   h("div", { key: "C" }, "CCC")
// ];
// const nextChildren = [
//   h("div", { key: "D" }, "DDD"),
//   h("div", { key: "E" }, "EEE"),
//   h("div", { key: "B" }, "BBB"),
//   h("div", { key: "C" }, "CCC"),
// ];

// 3.新的比旧的长 -- 创建新的
// 左侧
// (a,b)
// (a,b),c,d
// const prevChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
//   h("div", { key: "C" }, "CCC"),
//   h("div", { key: "D" }, "DDD"),
// ];

// 右侧
// (a,b)
// c,(a,b)
const prevChildren = [
  h("div", { key: "A" }, "AAA"), 
  h("div", { key: "B" }, "BBB"), 
];
const nextChildren = [
  h("div", { key: "C" }, "CCC"),
  h("div", { key: "A" }, "AAA"), 
  h("div", { key: "B" }, "BBB"), 
];

// 4. 旧的比新的长 -- 删除旧的
// 左侧
// const prevChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
//   h("div", { key: "C" }, "CCC"),
//   h("div", { key: "D" }, "DDD"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
// ];
// 右侧
// const prevChildren = [
//   h("div", { key: "A" }, "AAA"), 
//   h("div", { key: "B" }, "BBB"), 
//   h("div", { key: "C" }, "CCC"),
//   h("div", { key: "D" }, "DDD"),
// ];
// const nextChildren = [
//   h("div", { key: "C" }, "CCC"),
//   h("div", { key: "D" }, "DDD"), 
// ];

export default {
  name: "ArrayToArray",
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
