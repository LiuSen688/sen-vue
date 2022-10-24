export const extend = Object.assign;

// 判断值是不是对象数据类型
export const isObject = (val)=>{
    return val !==null && typeof val === 'object'
}

export const hasChanged = (val,newValue)=>{
    // 新旧值不同才会去执行逻辑，所以取反
    return !Object.is(val,newValue);
}