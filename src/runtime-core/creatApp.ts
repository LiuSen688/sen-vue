import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先转换成虚拟节点 vnode
        // component -> vnode
        // 后续的逻辑操作都会基于 vnode 虚拟节点做处理
        const vnode = createVNode(rootComponent);
        // 将虚拟结点转换为真实结点并挂载到 rootContainer DOM容器上
        render(vnode, rootContainer);
      },
    };
  };
}
