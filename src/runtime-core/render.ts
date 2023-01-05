import { isObject } from "./../shared/index";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./creatApp";
import { Fragment } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;
  function render(vnode, container) {
    // 调用patch方法
    patch(vnode, container, null);
  }

  function patch(vnode, container, parentComponent) {
    // 给定一个特殊标识 Fragment，它只渲染 children（子结点）
    switch (vnode.type) {
      case Fragment:
        processFragment(vnode.children, container, parentComponent);
        break;

      default:
        // 传入进 patch 的 vnode 可能是 element 类型，也可能是 component 类型
        // 根据vnode不同类型执行不同的处理函数
        if (typeof vnode.type === "string") {
          // 处理 element 类型
          processElement(vnode, container, parentComponent);
        } else if (isObject(vnode.type)) {
          // 处理 component 类型
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = createElement(vnode.type));

    const { children, props } = vnode;
    // 处理当前结点的子结点，其可能是 string 和 array 类型
    if (typeof children === "string") {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      // 数组中每一个元素都是一个虚拟结点，递归调用 patch
      mountChildren(children, el, parentComponent);
    }
    // 处理 props
    for (const key in props) {
      const val = props[key];
      // const isOn = (key: string) => /^on[A-Z]/.test(key);
      // if (isOn(key)) {
      //   const event = key.slice(2).toLowerCase();
      //   el.addEventListener(event, val);
      // } else {
      //   el.setAttribute(key, val);
      // }
      patchProp(el, key, val);
    }
    // container.append(el);
    insert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.forEach((v) => {
      patch(v, container, parentComponent);
    });
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    // 挂载组件
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(initialVnode: any, container, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode, parentComponent);
    // 处理 props、slot、
    // 这个函数执行完 instance 身上挂载上了 render 函数
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
  }

  function setupRenderEffect(instance: any, initialVnode, container) {
    const { proxy } = instance;
    // 虚拟结点树
    // 执行 render 函数 返回的是一个 h 函数
    const subTree = instance.render.call(proxy);
    patch(subTree, container, instance);
    // 此时所有的虚拟结点都变成真实DOM并完成了挂载
    initialVnode.el = subTree.el;
  }

  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent);
  }

  return {
    createApp:createAppAPI(render)
  }
}
