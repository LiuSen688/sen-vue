import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用patch方法
  patch(vnode, container);
}

function patch(vnode, container) {

  // TODO 
  // 判断 vnode 是不是一个 element
  // 是 element 就处理 element
  // processElement()
  // 处理组件
  processComponent(vnode, container);
}

function processComponent(vnode: any, container: any) {
  // 挂载组件
  mountComponent(vnode, container);
}
function mountComponent(vnode: any, container) {
  // 创建组件实例
  const instance = createComponentInstance(vnode);
  // 处理 props、slot、
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  // 虚拟结点树
  const subTree = instance.render();
  patch(subTree, container);
}
