import { mutableHandlers, readonlyHandles, shallowReadonlyHandlers } from "./baseHandlers";

// 枚举一些特殊属性
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly"
}

// 把 Proxy 抽离成函数，让代码更直观
function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

// reactive 方法实现
export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}
// readonly 方法实现
export function readonly(raw) {
  return createActiveObject(raw, readonlyHandles);
}
// shallowReadonly 方法实现
export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

// 检查一个对象是否是由 reactive() 创建的代理。
export function isReactive(value){
  // 只有是Proxy的属性被访问时才会触发 getter
  // 如果传入进来的不是Proxy，又因为该对象身上本身就没有枚举的属性，所以就会是 undefined
  // 所以通过 !! 将其转换为 Boolean 值
  return !!value[ReactiveFlags.IS_REACTIVE];
}

// 检查一个对象是否是由 readonly() 创建的代理。
export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

// isProxy 方法实现
export function isProxy(value){
  return isReactive(value) || isReadonly(value);
}