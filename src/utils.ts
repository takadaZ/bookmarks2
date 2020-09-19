/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */

export function $<T extends HTMLElement>(
  selector: string,
  parent: HTMLElement | DocumentFragment | Document = document,
) {
  return parent.querySelector(selector) as T;
}

export function $$<T extends HTMLElement[]>(
  selector: string,
  parent: HTMLElement | DocumentFragment | Document = document,
) {
  return [...parent.querySelectorAll(selector)] as T;
}

export function map<T, U>(f: (element: T) => U) {
  return (array: T[]) => array.map(f);
}

export function filter<T>(f: (element: T, i?: number, self?: T[]) => boolean) {
  return (array: T[]) => array.filter(f);
}

export function reduce<T, U>(f: (acc: U, element: T, i?: number, self?: T[]) => U, _init: U) {
  return (array: T[]): U => array.reduce(f, _init);
}

export function find<T>(f: (element: T, i?: number, self?: T[]) => boolean) {
  return (array: T[]) => array.find(f);
}

export function head<T>([a]: [T, ...any]) {
  return a;
}

export function second<T>([, a]: [any, T, ...any]) {
  return a;
}

export function third<T>([,, a]: [any, any, T, ...any]) {
  return a;
}

export function init(args: any[]) {
  return args.slice(0, -1);
}

export type Tail<T extends any[]> =
  ((...args: T) => any) extends (_head: any, ...rest: infer U) => any ? U : T;

export function tail<T extends any[]>([, ...rest]: T) {
  return rest as Tail<T>;
}

// tail for TypeScript 4.0
// function tail<T extends any[]>([, ...rest]: readonly [any, ...T]) {
//   return rest;
// }

type Last<T extends any[]> = T[Exclude<keyof T, keyof Tail<T>>];

export function last<T extends any[]>(args: T) {
  return args[args.length - 1] as Last<T>;
}

// test
const x: [_a: string, _b: number, _c: string] = ['1', 2, '3'];
head(x);
tail(x);
init(x);
last(x);

export function curry<T1, T2, U>
  (f: (p1: T1, p2: T2) => U): (p1: T1) => (p2: T2) => U;
export function curry<T1, T2, T3, U>
  (f: (p1: T1, p2: T2, p3: T3) => U): (p1: T1, p2: T2) => (p3: T3) => U;
export function curry<T1, T2, T3, T4, U>
  (f: (p1: T1, p2: T2, p3: T3, p4: T4) => U): (p1: T1, p2: T2, p3: T3) => (p4: T4) => U;
export function curry<T1, T2, T3, T4, T5, U>
  (f: (p1: T1, p2: T2, p3: T3, p4: T4, p5: T5) => U):
    (p1: T1, p2: T2, p3: T3, p4: T4) => (p5: T5) => U;
export function curry<T1, T2, T3, T4, T5, T6 extends any[], U>
  (f: (p1: T1, p2: T2, p3: T3, p4: T4, p5: T5, ..._tail: T6) => U):
    (p1: T1, p2: T2, p3: T3, p4: T4, p5: T5, ...p6: any[]) => (_last: Last<T6>) => U;
export function curry(f: (...args: any[]) => any) {
  return (..._init: any[]) => (lastArg: any) => f(...[..._init, lastArg]);
}

export function swap<T, U, V>(f: (a: T) => (b: U) => V) {
  return (b: U) => (a: T) => f(a)(b);
}

export async function cbToPromise<T>(f: (_: (a: T) => unknown) => unknown) {
  return new Promise<T>((resolve) => f(resolve));
}

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

export function pipe<T extends any[], R1, R2>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
): (...a: T) => R2;
export function pipe<T extends any[], R1, R2, R3>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
): (...a: T) => R3;
export function pipe<T extends any[], R1, R2, R3, R4>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
): (...a: T) => R4;
export function pipe<T extends any[], R1, R2, R3, R4, R5>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
): (...a: T) => R5;
export function pipe<T extends any[], R1, R2, R3, R4, R5, R6>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
): (...a: T) => R6;
export function pipe<T extends any[], R1, R2, R3, R4, R5, R6, R7>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
): (...a: T) => R7;
export function pipe<T extends any[], R1, R2, R3, R4, R5, R6, R7, R8>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
): (...a: T) => R8;
export function pipe<T extends any[], R1, R2, R3, R4, R5, R6, R7, R8, R9>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
  fn9: (a: R8) => R9,
): (...a: T) => R9;
export function pipe<T extends any[], R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
  fn9: (a: R8) => R9,
  fn10: (a: R9) => R10,
): (...a: T) => R10;

export function pipe(fn: any, ...fns: any[]) {
  return (...values: any) => fns.reduce((prevValue, nextFn) => nextFn(prevValue), fn(...values));
}

export function tap<T>(f: (a: T) => any) {
  return (a: T) => {
    f(a);
    return a;
  };
}

export function pipeP<T, R1, R2>(
  fn1: (a: T) => R1,
  fn2: (a: R1) => R2,
): (a: Promise<T>) => Promise<R2>;
export function pipeP<T, R1, R2, R3>(
  fn1: (a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
): (a: Promise<T>) => Promise<R3>;
export function pipeP<T, R1, R2, R3, R4>(
  fn1: (a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
): (a: Promise<T>) => Promise<R4>;
export function pipeP<T, R1, R2, R3, R4, R5>(
  fn1: (a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
): (a: Promise<T>) => Promise<R5>;
export function pipeP<T, R1, R2, R3, R4, R5, R6>(
  fn1: (a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
): (a: Promise<T>) => Promise<R6>;
export function pipeP<T, R1, R2, R3, R4, R5, R6, R7>(
  fn1: (a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
): (a: Promise<T>) => Promise<R7>;

export function pipeP(...fns: any[]) {
  return (p1: Promise<any>) => {
    fns.reduce((prevPromise, nextFn) => prevPromise.then(nextFn), p1);
  };
}
