import { configureStore, Slice, SliceCaseReducers, Reducer, CombinedState, AnyAction, createReducer, combineReducers } from '@reduxjs/toolkit';
import { slices, connects } from './redux-configure';

type Connect = (subscriber: StateSubscriber, listener: StateListener, dispatch: Dispatch) => void;
type SlicesMapObject<S = any, C = SliceCaseReducers<any>, A extends string = string> = {
  [K in keyof S]: Slice<S[K], SliceCaseReducers<S[K]>, A>
}
type ActionFromReducer<R> = R extends Reducer<any, infer A> ? A : never;
type ReducerFromSlice<M, K extends keyof M> = M[K];
type SliceFromSlicesMapObject<M> = M extends {
  [P in keyof M]: infer R
}
  ? R extends Slice<any, any>
    ? R
    : never
  : never;
type ActionFromSlicessMapObject<M> = M extends SlicesMapObject<any, any>
  ? ActionFromReducer<ReducerFromSlice<SliceFromSlicesMapObject<M>, 'reducer'>>
  : never;
type StateFromSlicesMapObject<M> = M extends SlicesMapObject<any, any>
  ? { [P in keyof M]: M[P] extends Slice<infer S, any> ? S : never }
  : never;
type StateFromSlice<M, K extends keyof M> = { [K in keyof M]: M extends Slice<infer S> ? S : never };
// type StateFromSlice<M, K extends keyof M> = M extends Slice<infer S> ? S : never;
// type StateFromSlicesMapObject1<M> = M extends SlicesMapObject<any, any>
//   ? StateFromSlice<SliceFromSlicesMapObject<M>, 'name'>
//   : never;
type NameObjectFromSlicessMapObject<M> = M extends SlicesMapObject<any, any>
  ? NameFromSlice<SliceFromSlicesMapObject<M>>
  : never;
type NameFromSlice<M> = M extends Slice<any, any, infer S> ? S : never;
type KeyValue<T> = { [x: string]: T };

const actionType = createReducer('', (builder) => {
  builder.addDefaultCase((state = '', action: AnyAction) => action.type);
});

const reducer = combineSlices(slices);
const store = configureStore({ reducer });

export type Actions = NameObjectFromSlicessMapObject<typeof slices>;
// export type States = keyof typeof slices;
export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;
export type SubscribeHandler = (state: State, dispatch: Dispatch) => void;
export type StateSubscriber = (handler: SubscribeHandler, actionTypes: Actions[]) => void;
export type ListenerHandler<T = State, U = Dispatch, V = any, W = any, X = any> = (state: T, dispatch: U, arg1: V, arg2: W, arg3: X) => void;
export type StateListener = <T, U, V>(handler: ListenerHandler<State, Dispatch, T, U, V>) => (arg1?: T, arg2?: U, arg3?: V) => ReturnType<ListenerHandler<State, Dispatch, T, U, V>>;

export function combineSlices<M extends SlicesMapObject<any, any>>(
  reducers: M
): Reducer<
  CombinedState<StateFromSlicesMapObject<M>>,
  ActionFromSlicessMapObject<M>
>;

export function combineSlices<M extends SlicesMapObject<any, any>>(slices: M) {
  const reducers = Object.entries(slices).reduce<KeyValue<Reducer>>((acc, [key, slice]) => {
    return { ...acc, [key]: slice.reducer };
  }, { actionType });
  return combineReducers(reducers);
}

function subscriber(handler: SubscribeHandler, actionTypes: Actions[] = []) {
  store.subscribe(() => {
    const state = store.getState();
    console.log((state as any).actionType);
    if (actionTypes.find(actionType => (state as any).actionType.startsWith(actionType + '/'))) {
      handler(state, store.dispatch);
    }
  });
}

function listener(handler: ListenerHandler) {
  return (arg1: any, arg2?: any, arg3?: any) => handler(store.getState(), store.dispatch, arg1, arg2, arg3);
}

function assignConnect(connects: Connect[]) {
  connects.map(connect => connect(subscriber, listener, store.dispatch));
}

assignConnect(connects);

const getClassName = Object.prototype.toString.call.bind(Object.prototype.toString);
const hasOwnProperty = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

function shallowEqual(a: any, b: any) {
  const classNameA = getClassName(a);
  if (classNameA !== getClassName(b)) {
    return false;
  }
  if (classNameA === '[object Array]') {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
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
    for (let i = 0; i < keysA.length; i++) {
      if (
        !hasOwnProperty(b, keysA[i]) ||
        !Object.is(a[keysA[i]], b[keysA[i]])
      ) {
        return false;
      }
    }
    return true;
  }
  return Object.is(a, b);
}
