import { createRenderer } from "../runtime-core";

export function createElement(type) {
  return document.createElement(type);
}

export function patchProp(el, key, val) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
  }
}

export function insert(el, container) {
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  console.log("...args: ", ...args);
  return renderer.createApp(...args);
}

export * from "../runtime-core";
