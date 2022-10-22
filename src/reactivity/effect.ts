// 抽离effect函数功能
class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    // 给存储 reactiveEffect 类的全局变量赋值
    reactiveEffect = this;
    this._fn();
  }
}


// 收集依赖
const targetMap = new Map();
export function track(target, key) {
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
  // 添加对应的 effect 函数（操作更改该属性值响应式的函数）
  // effect 函数从 ReactiveEffect类的实例中获取
  dep.add(reactiveEffect);
}

// 触发依赖

export function trigger(target, key) {
    // 取出收集到的依赖
    let depsMap = targetMap.get(target);
    // 该 key 所对应的 set 集合
    let dep = depsMap.get(key);
    // 遍历执行
    for (const effect of dep) {
        effect.run();
    }
}

// 存储 reactiveEffect 类的全局变量
let reactiveEffect;
// 执行 effect 函数传入的 fn 函数
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
