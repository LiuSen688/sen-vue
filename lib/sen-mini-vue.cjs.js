'use strict';

// 判断值是不是对象数据类型
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // todo
    // initProps()
    // initSlots()
    // 处理有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // 判断是否写了 setup 函数
    if (setup) {
        const setupResult = setup();
        // setup函数结果可能是函数（render函数）也可能是对象
        handleSetupResult(instance, setupResult);
    }
}
// 根据 setup 函数返回值进行判断处理
function handleSetupResult(instance, setupResult) {
    // 如果结果是对象
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // 调用patch方法
    patch(vnode, container);
}
function patch(vnode, container) {
    // 传入进 patch 的 vnode 可能是 element 类型，也可能是 component 类型
    // 根据vnode不同类型执行不同的处理函数
    if (typeof vnode.type === "string") {
        // 处理 element 类型
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理 component 类型
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const { children, props } = vnode;
    // 处理当前结点的子结点，其可能是 string 和 array 类型
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // 数组中每一个元素都是一个虚拟结点，递归调用 patch
        mountChildren(children, el);
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
function processComponent(vnode, container) {
    // 挂载组件
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    // 处理 props、slot、
    // 这个函数执行完 instance 身上挂载上了 render 函数
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // 虚拟结点树
    // 执行 render 函数 返回的是一个 h 函数
    const subTree = instance.render();
    patch(subTree, container);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children // 当前结点的子结点，可能是string类型或array类型
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转换成虚拟节点 vnode
            // component -> vnode
            // 后续的逻辑操作都会基于 vnode 虚拟节点做处理
            const vnode = createVNode(rootComponent);
            // 将虚拟结点转换为真实结点并挂载到 rootContainer DOM容器上
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
