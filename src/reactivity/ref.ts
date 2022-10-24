import { hasChanged, isObject } from "./../shared/index";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  private _rawValue: any;
  public dep;
  constructor(value) {
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
function convert(value){
    return isObject(value) ? reactive(value) : value;
}

// 根据全局变量是否被赋值 判断是否需要收集依赖
function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}
