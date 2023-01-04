import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance) {
  // todo
  initProps(instance, instance.vnode.props);
  initSlots(instance,instance.vnode.children);

  // 处理有状态的组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;
  // 判断是否写了 setup 函数
  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
    // setup函数结果可能是函数（render函数）也可能是对象
    handleSetupResult(instance, setupResult);
  }
}
// 根据 setup 函数返回值进行判断处理
function handleSetupResult(instance, setupResult: any) {
  // 如果结果是对象
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}
