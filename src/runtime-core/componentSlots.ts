export function initSlots(instance, children) {
  // 是否是插槽-是否需要做插槽处理
  // 虚拟结点类型是组件类型，且 children 是对象类型
  if (typeof instance.type == "object" && typeof children == "object") {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
