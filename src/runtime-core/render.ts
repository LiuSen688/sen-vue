import { isObject } from "./../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用patch方法
  patch(vnode, container);
}

function patch(vnode, container) {
  // 传入进 patch 的 vnode 可能是 element 类型，也可能是 component 类型
  // 根据vnode不同类型执行不同的处理函数
  if (typeof vnode.type === "string") {
    // 处理 element 类型
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    // 处理 component 类型
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);

  const { children, props } = vnode;
  // 处理当前结点的子结点，其可能是 string 和 array 类型
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    // 数组中每一个元素都是一个虚拟结点，递归调用 patch
    mountChildren(children,el);
  }
  // 处理 props
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.forEach((v) => {
    patch(v, container);
  });
}

function processComponent(vnode: any, container: any) {
  // 挂载组件
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  // 创建组件实例
  const instance = createComponentInstance(vnode);
  // 处理 props、slot、
  // 这个函数执行完 instance 身上挂载上了 render 函数
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  // 虚拟结点树
  // 执行 render 函数 返回的是一个 h 函数
  const subTree = instance.render();
  patch(subTree, container);
}
