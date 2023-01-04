export function createVNode(type, props?, children?) {
  const vnode = {
    type, // 虚拟结点的类型，可能是string类型或object类型
    props, // 该结点身上的属性
    children, // 当前结点的子结点，可能是string类型或array类型
    el: null,
  };
  return vnode;
}

export const Fragment = Symbol("Fragment");
