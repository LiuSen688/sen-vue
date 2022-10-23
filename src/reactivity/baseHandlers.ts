import { track, trigger } from "./effect";

// 抽离 Proxy 的 get 方法
function createGetter(isReadonly = false) {
  return function get(target, key) {
    // 读取值
    const res = Reflect.get(target, key);
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

// 防止每次触发 Proxy 的 getter和setter 时，都要调用抽离出的 createGetter 和 creatSetter 方法
const get = createGetter();
const set = creatSetter();
const readonlyGet = createGetter(true);

// 抽离 reactive方法的 Proxy 的对象配置
export const mutableHandlers = {
  get,
  set,
};
// 抽离 readonly方法的 Proxy 的对象配置
export const readonlyHandles = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key:${key} 为只读的`);
    return true;
  },
};