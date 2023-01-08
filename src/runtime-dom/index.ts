import { createRenderer } from "../runtime-core";

export function createElement(type) {
  return document.createElement(type);
}

export function patchProp(el, key, prevVal, nextVal) {
  // key 是否是以 on 开头
  // 如果是以 on 开头，则表明这是一个事件
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 截取on后面的字符串，用于注册事件
    const event = key.slice(2).toLowerCase();
    // 给 el 注册事件
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal == undefined || nextVal == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

export function insert(el, container, anchor) {
  // insertBefore API ：如果指定了锚点，则添加到锚点之前，若锚点为null，则添加到 el 后面
  debugger
  container.insertBefore(el, anchor || null);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  // args 传入进来的是根组件APP组件对象
  return renderer.createApp(...args);
}

export * from "../runtime-core";
