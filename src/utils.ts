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

export type Map<T extends Array<any>, U, V> = U extends T
  ? (f: (element: U[number], index: number, self: U) => V) => (array: T) => V[]
  : (f: (element: T[number], index: number, self: T) => V) => (array: T) => V[]

// export const map = <T, U, V>((f) => (array) => array.map(f)) as Map<T, U, V>;

export function map<T extends Array<any>, U>(
  f: (element: T[number], index: number, self: T[number][]) => U,
) {
  return (array: T) => array.map(f);
}

export function filter<T extends Array<any>>(
  f: (element: T[number], index: number, self: T[number][]) => boolean,
) {
  return (array: T) => array.filter(f) as T;
}

export function reduce<T extends Array<any>, U>(
  f: (acc: U, element: T[number], index?: number, self?: T[number][]) => U, _init: U,
) {
  return (array: T) => array.reduce(f, _init) as U;
}

export function find<T extends Array<any>>(
  f: (element: T[number], index?: number, self?: T[number][]) => boolean,
) {
  return (array: T) => array.find(f) as T[number];
}

export function tap<T>(f: (a: T) => any) {
  return (a: T) => {
    f(a);
    return a;
  };
}

export function forEach<T extends Array<any>>(
  f: (element: T[number], index: number, self: T[number][]) => void,
) {
  return (array: T) => array.forEach(f);
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

export function init<T extends Array<any>>(args: T) {
  return args.slice(0, -1);
}

export type Tail<T extends Array<any>> =
  ((...args: T) => any) extends (_head: any, ...rest: infer U) => any ? U : T;

export function tail<T extends Array<any>>([, ...rest]: T) {
  return rest as Tail<T>;
}

// tail for TypeScript 4.0
// function tail<T extends Array<any>>([, ...rest]: readonly [any, ...T]) {
//   return rest;
// }

type Last<T extends Array<any>> = T[Exclude<keyof T, keyof Tail<T>>];

export function last<T extends Array<any>>(args: T) {
  return args[args.length - 1] as Last<T>;
}

// test
const x: [_a: string, _b: number, _c: string, _d: number, _e: Array<string>] = ['1', 2, '3', 4, ['5', '6']];
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
export function curry<T1, T2, T3, T4, T5, T6 extends Array<any>, U>
  (f: (p1: T1, p2: T2, p3: T3, p4: T4, p5: T5, ..._tail: T6) => U):
    (p1: T1, p2: T2, p3: T3, p4: T4, p5: T5, ...p6: Array<any>) => (_last: Last<T6>) => U;

export function curry(f: (...args: Array<any>) => any) {
  return (..._init: Array<any>) => (lastArg: any) => f(...[..._init, lastArg]);
}

export function swap<T, U, V>(f: (a: T) => (b: U) => V) {
  return (b: U) => (a: T) => f(a)(b) as V;
}

// tset
function y(_a: number, _b: string, _c: boolean) {
  return null;
}
swap(curry(curry(y))(3))(false)('aaa');

export async function cbToPromise<T>(f: (_: (a: T) => any) => any) {
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

export function pipe<T extends Array<any>, R1, R2>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
): (...a: T) => R2;
export function pipe<T extends Array<any>, R1, R2, R3>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
): (...a: T) => R3;
export function pipe<T extends Array<any>, R1, R2, R3, R4>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
): (...a: T) => R4;
export function pipe<T extends Array<any>, R1, R2, R3, R4, R5>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
): (...a: T) => R5;
export function pipe<T extends Array<any>, R1, R2, R3, R4, R5, R6>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
): (...a: T) => R6;
export function pipe<T extends Array<any>, R1, R2, R3, R4, R5, R6, R7>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
): (...a: T) => R7;
export function pipe<T extends Array<any>, R1, R2, R3, R4, R5, R6, R7, R8>(
  fn1: (...a: T) => R1,
  fn2: (a: R1) => R2,
  fn3: (a: R2) => R3,
  fn4: (a: R3) => R4,
  fn5: (a: R4) => R5,
  fn6: (a: R5) => R6,
  fn7: (a: R6) => R7,
  fn8: (a: R7) => R8,
): (...a: T) => R8;
export function pipe<T extends Array<any>, R1, R2, R3, R4, R5, R6, R7, R8, R9>(
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
export function pipe<T extends Array<any>, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(
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

export function pipe(fn: any, ...fns: Array<any>) {
  return (...values: any) => fns.reduce((prevValue, nextFn) => nextFn(prevValue), fn(...values));
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

export function pipeP(...fns: Array<any>) {
  return (p1: Promise<any>) => {
    fns.reduce((prevPromise, nextFn) => prevPromise.then(nextFn), p1);
  };
}

// eslint-disable-next-line no-undef
export function eventListener<K extends keyof HTMLElementEventMap>(
  type: K,
  // eslint-disable-next-line no-undef
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  // eslint-disable-next-line no-undef
  options?: boolean | AddEventListenerOptions,
) {
  return (htmlElement: HTMLElement) => htmlElement.addEventListener(type, listener, options);
}

export function setEvents(selector: string, ...listeners: ReturnType<typeof eventListener>[]) {
  listeners.forEach((listener) => $$(selector).forEach(listener));
}
