import { mutableHandlers, readonlyHandles } from "./baseHandlers";
// reactive 方法实现
export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers)
}
// readonly 方法实现
export function readonly(raw) {
  return createActiveObject(raw, readonlyHandles)
}

// 把 Proxy 抽离成函数，让代码更直观
function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
