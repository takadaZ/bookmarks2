import { configureStore, Slice, SliceCaseReducers, Reducer, CombinedState, AnyAction } from '@reduxjs/toolkit';

import { slices, connect } from './background';

function actionType(state = '', action: AnyAction) {
  return action.type;
}

const reducer = combineReducers({ ...slices });
const store = configureStore({ reducer });

export type Actions = keyof typeof slices;
export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;
export type SubscribeHandler = (state: State, dispatch: Dispatch) => void;
export type StateSubscriber = (handler: SubscribeHandler, actionTypes: Actions[]) => void;
export type ListenerHandler<T = State, U = Dispatch, V = any, W = any, X = any> = (state: T, dispatch: U, arg1: V, arg2: W, arg3: X) => void;
export type StateListener = <T, U, V>(handler: ListenerHandler<State, Dispatch, T, U, V>) => (arg1?: T, arg2?: U, arg3?: V) => ReturnType<ListenerHandler<State, Dispatch, T, U, V>>;

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

type Connect = (subscriber: StateSubscriber, listener: StateListener, dispatch: Dispatch) => void;

function assignConnect(...connects: Connect[]) {
  connects.map(connect => connect(subscriber, listener, store.dispatch));
}

assignConnect(
  connect,
);

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

type ActionFromSlicessMapObject<M> = M extends SlicesMapObject<
  any,
  any
>
  ? ActionFromReducer<ReducerFromSlice<SliceFromSlicesMapObject<M>, 'reducer'>>
  : never;

type StateFromSlicesMapObject<M> = M extends SlicesMapObject<
  any,
  any
>
  ? { [P in keyof M]: M[P] extends Slice<infer S, any> ? S : never }
  : never;

type KeyValue<T> = { [x: string]: T };

export function combineReducers<M extends SlicesMapObject<any, any>>(
  reducers: M
): Reducer<
  CombinedState<StateFromSlicesMapObject<M>>,
  ActionFromSlicessMapObject<M>
>;

export function combineReducers<M>(slices: M) {
  const reducers = Object.entries(slices).reduce<KeyValue<Reducer>>((acc, [, slice]) => {
    return { ...acc, [slice.name]: slice.reducer };
  }, {});
  const finalReducers = { actionType, ...reducers };
  const finalReducerKeys = Object.keys(finalReducers);

  return function combination(state: KeyValue<any> = {}, action: AnyAction) {
    let hasChanged = false;
    const nextState: KeyValue<any> = {};
    Object.entries(finalReducers).forEach(([key, reducer]) => {
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  }
}

function getUndefinedStateErrorMessage(key: string, action: AnyAction) {
  const actionType = action && action.type
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}
