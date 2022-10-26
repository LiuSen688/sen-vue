export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  };
  return component;
}

export function setupComponent(instance) {
  // todo
  // initProps()
  // initSlots()

  // 处理有状态的组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
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
function handleSetupResult(instance, setupResult: any) {
  // 如果结果是对象
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if(Component.render) {
    instance.render = Component.render;
  }
}
