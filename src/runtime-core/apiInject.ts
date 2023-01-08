import { getCurrentInstance } from "./component";

// 存：provide的内容都存储到当前组件实例身上
export function provide(key, val) {
  // 获取当前组件实例对象
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    // 取出组件实例身上存放 provide 的属性值
    let { provides } = currentInstance;
    // 获取父级 provides
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

// 取：一般都是子组件取父组件注入的值，所以要从当前组件的父组件实例身上取 provide
export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent?.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if(typeof defaultValue === 'function') {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
