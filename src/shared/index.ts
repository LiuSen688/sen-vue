export const extend = Object.assign;

// 判断值是不是对象数据类型
export const isObject = (val)=>{
    return val !==null && typeof val === 'object'
}