import { createRenderer } from "../runtime-core";

export function createElement(type) {
  return document.createElement(type);
}

export function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal == undefined || nextVal == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

export function insert(el, container) {
  container.append(el);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  debugger
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
});

export function createApp(...args) {
  // args 传入进来的是根组件APP组件对象
  return renderer.createApp(...args);
}

export * from "../runtime-core";
