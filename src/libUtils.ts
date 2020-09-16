/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
const getClassName = Object.prototype.toString.call.bind(Object.prototype.toString);
const hasOwnProperty = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

export function objectEqaul(a: any, b: any, deep = false) {
  if (Object.is(a, b)) {
    return true;
  }
  const classNameA = getClassName(a);
  if (classNameA !== getClassName(b)) {
    return false;
  }
  if (classNameA === '[object Array]') {
    if (a.length !== b.length) {
      return false;
    }
    if (deep) {
      for (let i = 0; i < a.length; i += 1) {
        if (!objectEqaul(a[i], b[i], true)) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < a.length; i += 1) {
        if (Object.is(a[i], b[i])) {
          return false;
        }
      }
    }
    return true;
  }
  if (classNameA === '[object Object]') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    if (deep) {
      for (let i = 0; i < keysA.length; i += 1) {
        if (
          !hasOwnProperty(b, keysA[i])
          || !objectEqaul(a[keysA[i]], b[keysA[i]], true)
        ) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < keysA.length; i += 1) {
        if (
          !hasOwnProperty(b, keysA[i])
          || !Object.is(a[keysA[i]], b[keysA[i]])
        ) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}

export function pipe<T1 extends any[], R1>(fn1: (...a: T1) => R1): (...a: T1) => R1;
export function pipe<T1 extends any[], R1, R2>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2
): (...a: T1) => R2;
export function pipe<T1 extends any[], R1, R2, R3>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3
): (...a: T1) => R3;
export function pipe<T1 extends any[], R1, R2, R3, R4>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4
): (...a: T1) => R4;
export function pipe<T1 extends any[], R1, R2, R3, R4, R5>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5
): (...a: T1) => R5;
export function pipe<T1 extends any[], R1, R2, R3, R4, R5, R6>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
): (...a: T1) => R6;
export function pipe<T1 extends any[], R1, R2, R3, R4, R5, R6, R7>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
): (...a: T1) => R7;
export function pipe<T1 extends any[], R1, R2, R3, R4, R5, R6, R7, R8>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
): (...a: T1) => R8;
export function pipe<T1 extends any[], R1, R2, R3, R4, R5, R6, R7, R8, R9>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
  fn9: (a: R8) => R9,
): (...a: T1) => R9;
export function pipe<T1 extends any[], R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(
  fn1: (...a: T1) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
  fn9: (a: R8) => R9,
  fn10: (a: R9) => R10,
): (...a: T1) => R10

export function pipe(fn: any, ...fns: any[]) {
  return (...a: any) => fns.reduce((prev, next) => next(prev), fn(...a));
}
