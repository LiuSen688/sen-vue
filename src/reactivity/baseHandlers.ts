import { isObject, extend } from "./../shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

// 防止每次触发 Proxy 的 getter和setter 时，都要调用抽离出的 createGetter 和 creatSetter 方法
const get = createGetter();
const set = creatSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

// 抽离 Proxy 的 get 方法
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    // 判断是否是只读的
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
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

export const shallowReadonlyHandlers = extend({}, readonlyHandles, {
  get: shallowReadonlyGet,
});
