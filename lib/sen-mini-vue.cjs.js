'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
}
const Fragment = Symbol("Fragment");

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
// 判断值是不是对象数据类型
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// 首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// 转换为驼峰命名
const camelizeRE = /-(\w)/g;
const camelize = (str) => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

// 收集依赖
const targetMap = new Map();
// 触发依赖
function trigger(target, key) {
    // 取出收集到的依赖
    let depsMap = targetMap.get(target);
    // 该 key 所对应的 set 集合
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
// 抽离trigger触发依赖的逻辑
function triggerEffects(dep) {
    // 遍历执行收集到的依赖
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// 防止每次触发 Proxy 的 getter和setter 时，都要调用抽离出的 createGetter 和 creatSetter 方法
const get = createGetter();
const set = creatSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// 抽离 Proxy 的 get 方法
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 判断是否是只读的
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        // 读取值
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 嵌套对象仍然处理成reactive()响应式
        // 判断读取的值 是否是对象，如果是的话就用 reactive()处理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
// 抽离 Proxy 的 set 方法
function creatSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // TODO 触发依赖
        trigger(target, key);
        return res;
    };
}
// 抽离 reactive方法的 Proxy 的对象配置
const mutableHandlers = {
    get,
    set,
};
// 抽离 readonly方法的 Proxy 的对象配置
const readonlyHandles = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} 为只读的`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandles, {
    get: shallowReadonlyGet,
});

// 把 Proxy 抽离成函数，让代码更直观
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
// reactive 方法实现
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
// readonly 方法实现
function readonly(raw) {
    return createActiveObject(raw, readonlyHandles);
}
// shallowReadonly 方法实现
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    console.log("emit", event);
    // 看看对应组件实例上的props身上有没有emit对应的回调函数
    const { props } = instance;
    // 获取 props 中对应的回调函数
    const handler = props[toHandlerKey(camelize(event))];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};

function initSlots(instance, children) {
    // 是否是插槽-是否需要做插槽处理
    // 虚拟结点类型是组件类型，且 children 是对象类型
    if (typeof instance.type == "object" && typeof children == "object") {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    console.log("createComponentInstance", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // todo
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 处理有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    // 判断是否写了 setup 函数
    if (setup) {
        // 实现 getCurrentInstance 方法
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        // setup函数结果可能是函数（render函数）也可能是对象
        handleSetupResult(instance, setupResult);
        // 执行完 setup 函数后，重置全局变量
        setCurrentInstance(null);
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
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, val) {
    // 获取当前组件实例对象
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // 获取父级 provides
        debugger;
        // const parentProvides = currentInstance.parent.provides;
        // // 防止重复初始化
        // if (provides === parentProvides) {
        //   // 将父级的 provides 放入当当前组件实例的 provides 的原型链上
        //   // 目的是为了如果当前组件实例身上的 provides 对象没有对应的 key 值
        //   // 则继续往当前实例对象的父级身上的 provides 身上找，直到原型链的顶点 null
        //   provides = currentInstance.provides = Object.create(parentProvides);
        // }
        provides[key] = val;
    }
}
function inject(key) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        return parentProvides[key];
    }
}

function createAppAPI(render) {
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

function createRenderer(options) {
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
                }
                else if (isObject(vnode.type)) {
                    // 处理 component 类型
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    }
    function processElement(vnode, container, parentComponent) {
        mountElement(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = createElement(vnode.type));
        const { children, props } = vnode;
        // 处理当前结点的子结点，其可能是 string 和 array 类型
        if (typeof children === "string") {
            el.textContent = children;
        }
        else if (Array.isArray(children)) {
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
    function processComponent(vnode, container, parentComponent) {
        // 挂载组件
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        // 创建组件实例
        const instance = createComponentInstance(initialVnode, parentComponent);
        // 处理 props、slot、
        // 这个函数执行完 instance 身上挂载上了 render 函数
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        const { proxy } = instance;
        // 虚拟结点树
        // 执行 render 函数 返回的是一个 h 函数
        const subTree = instance.render.call(proxy);
        patch(subTree, container, instance);
        // 此时所有的虚拟结点都变成真实DOM并完成了挂载
        initialVnode.el = subTree.el;
    }
    function processFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    console.log("...args: ", ...args);
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createElement = createElement;
exports.createRenderer = createRenderer;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.patchProp = patchProp;
exports.provide = provide;
exports.renderSlots = renderSlots;
