import { reactive } from "../reactive";
import { effect, stop } from "../effect";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;

    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update 更新
    user.age++;
    expect(nextAge).toBe(12);
  });

  it("调用effect函数时，返回一个runner", () => {
    // 逻辑
    // 当调用effect函数时，会返回一个名为 runner 的函数
    // 调用 runner函数 执行 传入effect函数的 fn
    // 调用 fn 会把 fn 的返回值 return 回去
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe('foo');
  });

  it("scheduler", () => {
    // 1.通过 effect 的第二个参数给定的一个 scheduler 函数
    // 2.effect 第一次执行的时候，调用的是第一个参数的函数
    // 3.当响应式对象 set 更新时，不会执行第一个参数函数，而是执行 scheduler 函数
    // 4.如果当执行 runner 的时候，会再次执行第一个参数函数
    let dummy;
    let run: any;
    // scheduler 接收一个函数
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    // 当响应式数据发生更改的时候，执行scheduler，不执行第一个参数的函数
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(2);
    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("events: onStop", () => {
    const onStop = jest.fn();
    const runner = effect(() => { }, {
      onStop,
    });

    stop(runner);
    expect(onStop).toHaveBeenCalled();
  });
});

