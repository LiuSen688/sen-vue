import { reactive } from "../reactive";
import { effect } from "../effect";
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
});
