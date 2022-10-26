import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp(rootComponent){
    return {
        mount(rootComponent){
            // 先转换成虚拟节点 vnode
            // component -> vnode
            // 后续的逻辑操作都会基于 vnode 虚拟节点做处理
            const vnode = createVNode(rootComponent);

            render(vnode, rootComponent);
        }
    }
}

