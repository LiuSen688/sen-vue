import { effect } from "../reactivity/effect";
import { isObject } from "./../shared/index";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./creatApp";
import { Fragment } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert, remove: hostRemove, setElementText: hostSetElementText } = options;
  function render(vnode, container) {
    // 调用patch方法
    patch(null, vnode, container, null, null);
  }
  // n1 代表 老的 虚拟结点
  // n2 代表 新的 虚拟结点
  function patch(n1, n2, container, parentComponent, anchor) {
    // 给定一个特殊标识 Fragment，它只渲染 children（子结点）
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2.children, container, parentComponent, anchor);
        break;

      default:
        // 传入进 patch 的 vnode 可能是 element 类型，也可能是 component 类型
        // 根据vnode不同类型执行不同的处理函数
        if (typeof n2.type === "string") {
          // 处理 element 类型
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (isObject(n2.type)) {
          // 处理 component 类型
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processElement(n1, n2: any, container: any, parentComponent, anchor) {
    // 旧虚拟结点不存在，意味着是初次挂载
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    }
    // 旧虚拟结点存在，意味着要走更新流程
    else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    // 新虚拟结点
    console.log("n2: ", n2);
    // 旧虚拟结点
    console.log("n1: ", n1);
    // 获取新旧虚拟结点的 props 属性值（创建虚拟结点传入的第二个参数内容）
    // 为更新新旧结点 props 属性值做准备
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 从旧虚拟DOM结点身上拿到props所在的虚拟DOM结点
    // 并把它传递给新的虚拟DOM结点
    // 因为之后再更新的时候，此时的新虚拟结点就变成旧虚拟结点了
    const el = (n2.el = n1.el);
    // 对比更新虚拟结点的 props 属性（创建虚拟结点传入的第二个参数内容）
    patchProps(el, oldProps, newProps);
    // 对比更新虚拟结点的内容部分 （创建虚拟结点传入的第三个参数内容）
    // 可能是 text 文本
    // 可能是子虚拟结点
    patchChildren(n1, n2, el, parentComponent, anchor);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const n1Children = n1.children;
    const n2Children = n2.children;
    // 更新后的虚拟结点的 children 为 string 类型 (文本结点)
    if (typeof n2Children === "string") {
      // 旧虚拟结点的 children 为 array 类型（子结点数组）
      if (Array.isArray(n1Children)) {
        // 1.把旧的 children 清空
        unMountChildren(n1.children);
        // 2.设置新的 text
        hostSetElementText(container, n2Children);
      }
      // 旧虚拟结点的 children 为 string 类型
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
        mountChildren(n2Children, container, parentComponent, anchor);
      } else {
        // array diff array 的情况
        patchKeyedChildren(n1Children, n2Children, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(n1Children, n2Children, container, parentComponent, patchAnchor) {
    let i = 0;
    let e1 = n1Children.length - 1;
    let e2 = n2Children.length - 1;
    // 判断俩个结点是否是相同的
    function isSomeVNodeType(n1, n2) {
      // 利用俩个结点的 key 和 type 进行判断
      return n1.type === n2.type && n1.key === n2.key;
    }
    debugger;
    // 从左侧开始的对比
    while (i <= e1 && i <= e2) {
      // 取出新旧数组相同下标所对应的元素
      const n1 = n1Children[i];
      const n2 = n2Children[i];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, patchAnchor);
      } else {
        break;
      }
      i++;
    }
    // 从右侧开始的对比
    while (i <= e1 && i <= e2) {
      const n1 = n1Children[e1];
      const n2 = n2Children[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, patchAnchor);
      } else {
        break;
      }
      // e1 e2 分别是新旧数组结点的末尾，从右像左遍历，所以是 --
      e1--;
      e2--;
    }
    // 新的比旧的长 -- 新增结点
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < n2Children.length ? n2Children[nextPos].el : null;
        debugger;
        while (i <= e2) {
          patch(null, n2Children[i], container, parentComponent, anchor);
          i++;
        }
      }
    }
    // 旧的比新的长 -- 删除旧结点
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(n1Children[i].el);
        i++;
      }
    } else {
      // 乱序的部分
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

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // 根据虚拟结点 type 对应的属性值创建真实DOM，并把该真实DOM赋值给虚拟结点对象中的 el 属性
    const el = (vnode.el = createElement(vnode.type));
    // 结构出虚拟结点的第二个和第三个参数
    const { children, props } = vnode;
    // 处理当前结点的子结点，其可能是 string 和 array 类型
    if (typeof children === "string") {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      // 数组中每一个元素都是一个虚拟结点，递归调用 patch
      mountChildren(children, el, parentComponent, anchor);
    }
    // 处理 props
    // 从第二个对象参数中依次拿出对应的 key 和 value 并传入到 patchProp 方法
    for (const key in props) {
      const val = props[key];
      // 单独抽离出来的处理 props 方法
      patchProp(el, key, null, val);
    }
    // 将处理好的真实DOM挂载到指定DOM容器结点上
    insert(el, container);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
    // 挂载组件
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(initialVnode: any, container, parentComponent, anchor) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode, parentComponent);
    // 处理 props、slot、
    // 这个函数执行完 instance 身上挂载上了 render 函数
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVnode, container, anchor) {
    // 利用effect进行依赖收集
    effect(() => {
      // 如果没有挂载则挂载结点（初次初始化）
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 虚拟结点树
        // 执行 render 函数 返回的是一个 h 函数
        // 同时给 instance 实例身上挂载一个当前的 subTree 虚拟结点
        const subTree = (instance.subTree = instance.render.call(proxy));
        console.log("init: ", subTree);
        patch(null, subTree, container, instance, anchor);
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
        patch(preSubTree, subTree, container, instance, anchor);
      }
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
    mountChildren(n2, container, parentComponent, anchor);
  }

  return {
    createApp: createAppAPI(render),
  };
}
