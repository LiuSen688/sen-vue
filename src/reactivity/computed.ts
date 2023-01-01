import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  // 标志 getter 是否被调用过
  private _dirty: boolean = true;
  // 实现计算属性的缓存
  private _value: any;
  
  private _effect: any;
  constructor(getter) { 
    // 利用 scheduler 
    // 当传入 scheduler 后，触发依赖不会执行 getter 函数
    // 需要手动执行 runner
    // 实例化 ReactiveEffect 类，为了收集依赖
    this._effect = new ReactiveEffect(getter,()=>{
      // 当响应式依赖发生改变的时候，会触发 setter 的 trigger
      // 而因为有 scheduler 的存在，所以会执行 scheduler 而不会执行收集的依赖
      if(!this._dirty) {
        // 恢复_dirty变量--当用户再次调用
        this._dirty = true;
      }
    });
  }
  get value() {
    // 调用完一次之后通过_dirty变量状态控制是否再次调用传入的getter函数
    if (this._dirty) {
      this._dirty = false;
      // _dirty为true时，执行 getter 函数并把值更新给_value
      this._value = this._effect.run();
    }
    // 不是初次调用，直接返回旧值
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
