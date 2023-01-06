import { effect } from "../reactivity/effect";
import { isObject } from "./../shared/index";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./creatApp";
import { Fragment } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert, remove: hostRemove, setElementText: hostSetElementText } = options;
  function render(vnode, container) {
    // 调用patch方法
    patch(null, vnode, container, null);
  }
  // n1 代表 老的 虚拟结点
  // n2 代表 新的 虚拟结点
  function patch(n1, n2, container, parentComponent) {
    // 给定一个特殊标识 Fragment，它只渲染 children（子结点）
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2.children, container, parentComponent);
        break;

      default:
        // 传入进 patch 的 vnode 可能是 element 类型，也可能是 component 类型
        // 根据vnode不同类型执行不同的处理函数
        if (typeof n2.type === "string") {
          // 处理 element 类型
          processElement(n1, n2, container, parentComponent);
        } else if (isObject(n2.type)) {
          // 处理 component 类型
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    debugger;
    // 旧虚拟结点不存在，意味着是初次挂载
    if (!n1) {
      mountElement(n2, container, parentComponent);
    }
    // 旧虚拟结点存在，意味着要走更新流程
    else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement: ");
    console.log("n2: ", n2);
    console.log("n1: ", n1);

    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 从旧虚拟DOM结点身上拿到props所在的虚拟DOM结点
    // 并把它传递给新的虚拟DOM结点
    // 因为之后再更新的时候，此时的新虚拟结点就变成旧虚拟结点了
    const el = (n2.el = n1.el);

    patchProps(el, oldProps, newProps);
    patchChildren(n1, n2, el, parentComponent);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    const n1Children = n1.children;
    const n2Children = n2.children;
    // 更新后的虚拟结点的 children 为 string 类型 (文本结点)
    if (typeof n2Children === "string") {
      if (Array.isArray(n1Children)) {
        // 1.把旧的 children 清空
        unMountChildren(n1.children);
        // 2.设置新的 text
        hostSetElementText(container, n2Children);
      }
      // 更新后的虚拟结点的 children 为 array 类型
      else {
        if (n1Children !== n2Children) {
          hostSetElementText(container, n2Children);
        }
      }
    }
    // 更新后的虚拟结点的 children 为 array 类型
    else {
      if (typeof n1Children === "string") {
        // text  --> array
        // 先清空之前的文本结点
        hostSetElementText(container, "");
        // 将新的 array 类型的 children虚拟结点变成真实DOM并挂载
        mountChildren(n2Children, container, parentComponent);
      }
    }
  }

  function unMountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // 移除结点
      hostRemove(el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    // 新旧虚拟结点中的 props 不相同了才需要去对比更新
    if (oldProps !== newProps) {
      // 处理 props 的值有改变
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];

        if (prevProp !== nextProp) {
          patchProp(el, key, prevProp, nextProp);
        }
      }
      // 处理 props 在新的虚拟结点更新后，其中少了某个 key
      // 则删除对应的 key
      for (const key in oldProps) {
        if (!(key in newProps)) {
          // 因为新虚拟结点中 props 中没有对应的 key 了
          // 所以 patchProp 的第四个参数为 null
          patchProp(el, key, oldProps[key], null);
        }
      }
    }
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
      // 单独抽离出来的处理 props 方法
      patchProp(el, key, null, val);
    }
    // 将处理好的真实DOM挂载到指定DOM容器结点上
    insert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    // if (!n1) {
    //   // 初始化 component
    //   mountComponent(n2, container, parentComponent);
    // } else {
    //   patchElement(n1, n2, container);
    // }
    // 挂载组件
    mountComponent(n2, container, parentComponent);
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
    // 利用effect进行依赖收集
    effect(() => {
      debugger;
      // 如果没有挂载则挂载结点（初次初始化）
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 虚拟结点树
        // 执行 render 函数 返回的是一个 h 函数
        // 同时给 instance 实例身上挂载一个当前的 subTree 虚拟结点
        const subTree = (instance.subTree = instance.render.call(proxy));
        console.log("init: ", subTree);
        patch(null, subTree, container, instance);
        // 此时所有的虚拟结点都变成真实DOM并完成了挂载
        initialVnode.el = subTree.el;
        instance.isMounted = true;
      }
      // 结点已经被挂载过，则进行更新
      else {
        console.log("update");
        // 获取更新后的虚拟结点树
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const preSubTree = instance.subTree;
        // 更新目前最新的虚拟结点树 subTree，为之后对比更新做准备
        instance.subTree = subTree;
        console.log("old", preSubTree);
        console.log("new", subTree);
        // 更新
        patch(preSubTree, subTree, container, instance);
      }
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  return {
    createApp: createAppAPI(render),
  };
}
