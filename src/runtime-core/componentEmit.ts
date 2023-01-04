import { toHandlerKey, camelize } from "../shared/index";

export function emit(instance, event, ...args) {
  console.log("emit", event);
  // 看看对应组件实例上的props身上有没有emit对应的回调函数
  const { props } = instance;
  // 获取 props 中对应的回调函数
  const handler = props[toHandlerKey(camelize(event))];
  handler && handler(...args);
}
