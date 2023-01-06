import { getCurrentInstance } from "./component";

export function provide(key, val) {
  // 获取当前组件实例对象
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    // 获取父级 provides
    debugger
    const parentProvides = currentInstance.parent?.provides;
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

export function inject(key) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent?.provides;
    return parentProvides[key];
  }
}
