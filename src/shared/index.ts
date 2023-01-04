export const extend = Object.assign;

// 判断值是不是对象数据类型
export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const hasChanged = (val, newValue) => {
  // 新旧值不同才会去执行逻辑，所以取反
  return !Object.is(val, newValue);
};

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 首字母大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
// 转换为驼峰命名
const camelizeRE = /-(\w)/g;
export const camelize = (str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};

export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
