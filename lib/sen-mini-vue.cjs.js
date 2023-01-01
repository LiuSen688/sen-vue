'use strict';

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
    patch(vnode);
}
function patch(vnode, container) {
    // TODO 
    // 判断 vnode 是不是一个 element
    // 是 element 就处理 element
    // processElement()
    // 处理组件
    processComponent(vnode);
}
function processComponent(vnode, container) {
    // 挂载组件
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    // 处理 props、slot、
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    // 虚拟结点树
    const subTree = instance.render();
    patch(subTree);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children
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
            render(vnode);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
