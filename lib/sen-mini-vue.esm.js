function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        key: props && props.key
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
const hasChanged = (val, newValue) => {
    // 新旧值不同才会去执行逻辑，所以取反
    return !Object.is(val, newValue);
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

// 存储 ReactiveEffect 类的全局变量
let reactiveEffect;
let shouldTrack;
// 抽离effect函数功能
class ReactiveEffect {
    constructor(fn, scheduler) {
        // 反向收集 effect
        this.deps = [];
        // stop方法是否执行过的标志
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 如果是 stop 状态 直接调用 fn
        if (!this.active) {
            return this._fn();
        }
        // 没有执行过 stop 应该触发依赖收集
        shouldTrack = true;
        // 给存储 ReactiveEffect 类的全局变量赋值
        reactiveEffect = this;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // 性能优化：防止频繁调用stop重复清空
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// 是否要收集依赖
function isTracking() {
    return shouldTrack && reactiveEffect !== undefined;
}
// 收集依赖
const targetMap = new Map();
function track(target, key) {
    // 是否执行过 stop 方法 -> 执行过当再次触发 getter 时不应该收集依赖
    if (!isTracking())
        return;
    // 什么是依赖？
    // 通过reactive()声明的响应式对象 -> 对应的所有有关触发响应式数据更新的函数的集合
    // 需要一个容器存储所收集的所有依赖，而依赖对应的函数不能重复，所以选择使用 Set 进行存储
    // target -> key -> dep
    // 嵌套层次： 一个总Map，k：传入reactive()中的target对象，v：子Map
    // 子Map中，k：targer对象中的属性名 v：更改该属性值的函数
    // 从总Map targetMap 中取出对应对象的值
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        // 如果没有值则初始化
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // 在该对象的Map中获取对应 属性名 key 的 set（存放的是操作更改该属性值响应式的函数）
    let dep = depsMap.get(key);
    if (!dep) {
        // 没有值则初始化
        dep = new Set();
        depsMap.set(key, dep);
    }
    // 收集依赖
    trackEffects(dep);
}
// 抽离 track 收集依赖的逻辑
function trackEffects(dep) {
    // 收集的内容已经存在与 dep 中了
    if (dep.has(reactiveEffect))
        return;
    // 依赖：对响应式数据的更改会作为函数 fn 传入到 effect 函数中，要收集的就是这个 fn 函数，而fn函数会被包含在一个抽离的ReactiveEffect类的实例中获取类中
    // fn 函数从 ReactiveEffect类的实例中获取
    dep.add(reactiveEffect);
    // 反向收集依赖--为了stop时清空依赖
    reactiveEffect.deps.push(dep);
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 代码优化，因为 options 身上可能有很多其他属性
    //_effect.onStop = options.onStop;
    extend(_effect, options);
    // 执行 effect 函数传入的 fn 函数
    _effect.run();
    // 返回用户传入的 fn 函数
    const runner = _effect.run.bind(_effect);
    // 为了能够调用实例身上的stop方法，所以给该 runner 函数身上挂一个实例属性
    runner.effect = _effect;
    return runner;
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
        // 判断是否是只读的
        if (!isReadonly) {
            track(target, key);
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

class RefImpl {
    constructor(value) {
        // 判断是否是 Ref 的标志
        this.__v_isRef = true;
        // 存储一下最初传入的 value值
        // 因为传入的value如果是对象的话，会经过reactive处理变成Proxy
        // 而判断更改数据时新旧数据是否一致应该是俩个普通的obj对象进行比较
        this._rawValue = value;
        // 判断传入 Ref 方法中的值是否是一个对象
        // 如果是一个对象，要用 reactive 方法处理一下
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 根据全局变量是否被赋值 判断是否需要收集依赖
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 如果赋值前后有发生变化，则赋新值并执行依赖
        if (hasChanged(newValue, this._rawValue)) {
            // 先修改 _value 值，再执行收集的依赖
            this._rawValue = newValue;
            this._value = convert(newValue);
            // 执行收集的依赖
            triggerEffects(this.dep);
        }
    }
}
// 根据传入的值是否是对象数据类型决定是否需要reactive处理一下
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
// 根据全局变量是否被赋值 判断是否需要收集依赖
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
// ref 处理基本数据类型为响应式
function ref(value) {
    return new RefImpl(value);
}
// 判断变量是否是 Ref 类型
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    // 逻辑
    // 判断传入的 ref 是否是 Ref 类型
    // 是：返回 ref.value  不是：返回 ref 本身
    return isRef(ref) ? ref.value : ref;
}
// 主要用在template模板中，可以不用通过.value访问到ref类型的值
function proxyRefs(objetWithRefs) {
    return new Proxy(objetWithRefs, {
        get(target, key) {
            // 判断读取的属性名的值是否是 Ref 类型
            // 逻辑同 unRef 方法
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 如果想要改变的属性值是Ref类型，且要改变的新值不是Ref类型
            // 则更新该Ref类型属性的value值
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
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
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        subTree: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
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
        instance.setupState = proxyRefs(setupResult);
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

// 存：provide的内容都存储到当前组件实例身上
function provide(key, val) {
    var _a;
    // 获取当前组件实例对象
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 取出组件实例身上存放 provide 的属性值
        let { provides } = currentInstance;
        // 获取父级 provides
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        // 防止重复初始化
        if (provides === parentProvides) {
            // 将父级的 provides 放入当当前组件实例的 provides 的原型链上
            // 目的是为了如果当前组件实例身上的 provides 对象没有对应的 key 值
            // 则继续往当前实例对象的父级身上的 provides 身上找，直到原型链的顶点 null
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
// 取：一般都是子组件取父组件注入的值，所以要从当前组件的父组件实例身上取 provide
function inject(key, defaultValue) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
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
    const { createElement, patchProp, insert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // 调用patch方法
        patch(null, vnode, container, null);
    }
    // n1 代表 老的 虚拟结点
    // n2 代表 新的 虚拟结点
    function patch(n1, n2, container, parentComponent, anchor) {
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
                }
                else if (isObject(n2.type)) {
                    // 处理 component 类型
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 旧虚拟结点不存在，意味着是初次挂载
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        // 旧虚拟结点存在，意味着要走更新流程
        else {
            patchElement(n1, n2, container, parentComponent);
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
        patchChildren(n1, n2, el, parentComponent);
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
                mountChildren(n2Children, container, parentComponent);
            }
            else {
                // array diff array 的情况
                patchKeyedChildren(n1Children, n2Children, container, parentComponent);
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
        // 从左侧开始的对比
        while (i <= e1 && i <= e2) {
            // 取出新旧数组相同下标所对应的元素
            const n1 = n1Children[i];
            const n2 = n2Children[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        // 从右侧开始的对比
        while (i <= e1 && i <= e2) {
            const n1 = n1Children[e1];
            const n2 = n2Children[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
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
                nextPos < n2Children.length ? n2Children[nextPos].el : null;
                debugger;
                while (i <= e2) {
                    patch(null, n2Children[i], container, parentComponent);
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
        }
        else {
            debugger;
            // 中间对比
            let s1 = i;
            let s2 = i;
            // 记录新虚拟结点数组中间部分需要被对比的数组长度
            const toBePatched = e2 - s2 + 1;
            // 新虚拟结点数组中间部分已经被处理过的数量
            let patched = 0;
            // 建立新虚拟结点数组中间部分的映射表
            const keyToNewIndexMap = new Map();
            // 根据新虚拟结点数组经过双端对比后的中间范围的长度创建一个数组，当作映射表
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 初始化映射表
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            for (let i = s2; i <= e2; i++) {
                const nextChild = n2Children[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 在新虚拟结点中间部分的映射表中进行查找
            for (let i = s1; i <= e1; i++) {
                const prevChild = n1Children[i];
                // 优化点: 如果新的虚拟结点数组的中间部分都被遍历完了
                // 而旧虚拟结点的中间部分仍然有结点，那么这些多出来的旧虚拟结点数组中间部分的结点都可以被直接删除。
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 如果该结点有 key 的话
                if (prevChild.key != null) {
                    // 根据旧虚拟结点的 key 到新虚拟结点中间部分映射表去查找，看能不能获取到值
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果该结点没有 key 的话
                    // 遍历新结点的中间范围去查找是否有这个结点
                    for (let j = s2; j < e2; j++) {
                        if (isSomeVNodeType(prevChild, n2Children[j])) {
                            // 查找到的话更新当前结点的下标
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 如果最终没找到，意味着在新虚拟结点数组中不存在---删除
                if (newIndex == undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    debugger;
                    // newIndex：旧中间结点数组映射到新中间结点数组的索引
                    // newIndex - s2：旧中间结点数组的结点处在新中间结点数组 newIndexToOldIndexMap 映射表中的索引
                    // i 是遍历旧中间结点数组的索引
                    // i + 1 是因为 i 的值可能为0，而 newIndexToOldIndexMap 初始化时值为 0，代表没有建立映射关系
                    // 所以 + 1 确保当 i = 0 时也能表明建立了映射关系
                    // 没有建立 newIndexToOldIndexMap 映射关系的结点表明：新的在老的中不存在，要创建
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 如果新旧都存在的话，在进行深度对比，看看俩结点的 props 有没有变化
                    patch(prevChild, n2Children[newIndex], container, parentComponent);
                    patched++;
                }
            }
            // 最长递增子序列
            debugger;
            // 利用最长递增子序列算法确定出新中间结点数组的稳定序列
            const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
            let j = increasingNewIndexSequence.length - 1; // 最长递增子序列的指针
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = n2Children[nextIndex];
                const anchor = nextIndex + 1 < n2Children.length ? n2Children[nextIndex + 1].el : null;
                debugger;
                if (i !== increasingNewIndexSequence[j]) {
                    console.log("移动位置");
                    insert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
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
    function mountElement(vnode, container, parentComponent, anchor) {
        // 根据虚拟结点 type 对应的属性值创建真实DOM，并把该真实DOM赋值给虚拟结点对象中的 el 属性
        const el = (vnode.el = createElement(vnode.type));
        // 结构出虚拟结点的第二个和第三个参数
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
            patch(null, v, container, parentComponent);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        // 挂载组件
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = createComponentInstance(initialVnode, parentComponent);
        // 处理 props、slot、
        // 这个函数执行完 instance 身上挂载上了 render 函数
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
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
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2, container, parentComponent);
    }
    return {
        createApp: createAppAPI(render),
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // key 是否是以 on 开头
    // 如果是以 on 开头，则表明这是一个事件
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 截取on后面的字符串，用于注册事件
        const event = key.slice(2).toLowerCase();
        // 给 el 注册事件
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal == undefined || nextVal == null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container, anchor) {
    // insertBefore API ：如果指定了锚点，则添加到锚点之前，若锚点为null，则添加到 el 后面
    debugger;
    container.insertBefore(el, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    // args 传入进来的是根组件APP组件对象
    return renderer.createApp(...args);
}

export { createApp, createElement, createRenderer, getCurrentInstance, h, inject, insert, patchProp, provide, proxyRefs, ref, renderSlots };
