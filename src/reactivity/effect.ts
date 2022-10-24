import { extend } from "../shared/index";

// 存储 ReactiveEffect 类的全局变量
let reactiveEffect;
let shouldTrack;

// 抽离effect函数功能
class ReactiveEffect {
  private _fn: any;
  // 反向收集 effect
  deps = [];
  // stop方法是否执行过的标志
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    if (!this.active) {
      return this._fn();
    }
    // 没有执行过 stop 应该触发依赖收集
    shouldTrack = true;
    // 给存储 ReactiveEffect 类的全局变量赋值
    reactiveEffect = this;
    const result = this._fn();
    shouldTrack = false;
    return result;
  }
  stop() {
    // 性能优化：防止频繁调用stop重复清空
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}
// 是否要收集依赖
export function isTracking() {
  // if (!shouldTrack) return;
  // if (!reactiveEffect) return;
  return shouldTrack && reactiveEffect !== undefined;
}

// 收集依赖
const targetMap = new Map();
export function track(target, key) {
  // 是否执行过 stop 方法 -> 执行过当再次触发 getter 时不应该收集依赖
  if (!isTracking()) return;

  // 什么是依赖？
  // 通过reactive()声明的响应式对象 -> 对应的所有有关触发响应式数据更新的函数的集合
  // 需要一个容器存储所收集的所有依赖，而依赖对应的函数不能重复，所以选择使用 Set 进行存储

  // target -> key -> dep
  // 嵌套层次： 一个总Map，k：传入reactive()中的target对象，v：子Map
  // 子Map中，k：targer对象中的属性名 v：更改该属性值的函数

  // 从总Map targetMap 中取出对应对象的值
  let depsMap = targetMap.get(target);

  if (!depsMap) {
    // 如果没有值则初始化
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 在该对象的Map中获取对应 属性名 key 的 set（存放的是操作更改该属性值响应式的函数）
  let dep = depsMap.get(key);
  if (!dep) {
    // 没有值则初始化
    dep = new Set();
    depsMap.set(key, dep);
  }
  // 收集依赖
  trackEffects(dep);
}

// 抽离 track 收集依赖的逻辑
export function trackEffects(dep) {
  // 收集的内容已经存在与 dep 中了
  if (dep.has(reactiveEffect)) return;

  // 依赖：对响应式数据的更改会作为函数 fn 传入到 effect 函数中，要收集的就是这个 fn 函数，而fn函数会被包含在一个抽离的ReactiveEffect类的实例中获取类中
  // fn 函数从 ReactiveEffect类的实例中获取
  dep.add(reactiveEffect);
  // 反向收集依赖--为了stop时清空依赖
  reactiveEffect.deps.push(dep);
}

// 触发依赖
export function trigger(target, key) {
  // 取出收集到的依赖
  let depsMap = targetMap.get(target);
  // 该 key 所对应的 set 集合
  let dep = depsMap.get(key);
  triggerEffects(dep);
}

// 抽离trigger触发依赖的逻辑
export function triggerEffects(dep) {
  // 遍历执行收集到的依赖
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // 代码优化，因为 options 身上可能有很多其他属性
  //_effect.onStop = options.onStop;
  extend(_effect, options);

  // 执行 effect 函数传入的 fn 函数
  _effect.run();
  // 返回用户传入的 fn 函数
  const runner: any = _effect.run.bind(_effect);
  // 为了能够调用实例身上的stop方法，所以给该 runner 函数身上挂一个实例属性
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
