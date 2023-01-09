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
// const prevChildren = [
//   h("div", { key: "A" }, "AAA"),
//   h("div", { key: "B" }, "BBB"),
// ];
// const nextChildren = [
//   h("div", { key: "C" }, "CCC"),
//   h("div", { key: "A" }, "AAA"),
//   h("div", { key: "B" }, "BBB"),
// ];

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

// 5. 对比中间的部分
// 删除老的（在老的中存在，在新的中不存在）
// 5.1
// a,b,(c,d),f,g
// a,b,(e,c),f,g
// d 结点在新数组中没有 -- 删除
// c 结点的 props 有变化需要更新

// const prevChildren = [
//   h("p", { key: "A" }, "AAA"),
//   h("p", { key: "B" }, "BBB"),
//   h("p", { key: "C", id: "c-prev" }, "CCC"),
//   h("p", { key: "D" }, "DDD"),
//   h("p", {}, "FFF"),
//   h("p", { key: "G" }, "GGG"),
// ];
// const nextChildren = [
//   h("p", { key: "A" }, "AAA"),
//   h("p", { key: "B" }, "BBB"),
//   h("p", { key: "E" }, "EEE"),
//   h("p", { key: "C", id: "c-next" }, "CCC"),
//   h("p", { key: "F" }, "FFF"),
//   h("p", { key: "G" }, "GGG"),
// ];

// 5.2 移动（结点在新的和老的中都存在，但是位置变了）
// a,b,(c,d,e),f,g
// a,b,(e,c,d),f,g
// 最长子序列 【1，2】

const prevChildren = [
  h("p", { key: "A" }, "AAA"),
  h("p", { key: "B" }, "BBB"),
  h("p", { key: "C" }, "CCC"),
  h("p", { key: "D" }, "DDD"),
  h("p", { key: "E" }, "EEE"),
  h("p", { key: "F" }, "FFF"),
  h("p", { key: "G" }, "GGG"),
];
const nextChildren = [
  h("p", { key: "A" }, "AAA"),
  h("p", { key: "B" }, "BBB"),
  h("p", { key: "E" }, "EEE"),
  h("p", { key: "C" }, "CCC"),
  h("p", { key: "D" }, "DDD"),
  h("p", { key: "F" }, "FFF"),
  h("p", { key: "G" }, "GGG"),
];

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
