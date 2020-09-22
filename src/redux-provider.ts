/* eslint-disable import/first */
export { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  configureStore,
  Slice,
  SliceCaseReducers,
  Reducer,
  CombinedState,
  AnyAction,
  createReducer,
  combineReducers,
  Dispatch as DispatchA,
} from '@reduxjs/toolkit';

import { mergedSlices, mergedConnects } from './redux-configure';

type SlicesMapObject<S = any, A extends string = string> = {
  [K in keyof S]: Slice<S[K], SliceCaseReducers<S[K]>, A>
}
type ActionFromReducer<R> = R extends Reducer<any, infer A> ? A : never;
type MemberFromSlice<M, K extends keyof M> = M[K];
type SliceFromSlicesMapObject<M> = M extends {
  // eslint-disable-next-line no-unused-vars
  [P in keyof M]: infer R
}
  ? R extends Slice<any, any>
    ? R
    : never
  : never;
type ActionFromSlicessMapObject<M> = M extends SlicesMapObject<any, any>
  ? ActionFromReducer<MemberFromSlice<SliceFromSlicesMapObject<M>, 'reducer'>>
  : never;
type StateFromSlicesMapObject<M> = M extends SlicesMapObject<any, any>
  ? { [P in keyof M]: M[P] extends Slice<infer S, any> ? S : never }
  : never;
type NameFromSlice<M> = M extends Slice<any, any, infer S> ? S : never;
type NameObjectFromSlicessMapObject<M> = M extends SlicesMapObject<any, any>
  ? NameFromSlice<SliceFromSlicesMapObject<M>>
  : never;
type KeyValue<T> = { [x: string]: T };

const actionType = createReducer('', (builder) => {
  builder.addDefaultCase((state, action: AnyAction) => action.type);
});

// eslint-disable-next-line no-unused-vars
export function combineSlices<M extends SlicesMapObject<any, any>>(slices: M): Reducer<
  CombinedState<StateFromSlicesMapObject<M>>,
  ActionFromSlicessMapObject<M>
>
// eslint-disable-next-line no-redeclare
export function combineSlices<M extends SlicesMapObject<any, any>>(slices: M) {
  const reducers = Object.entries(slices).reduce<KeyValue<Reducer>>(
    (acc, [key, slice]) => ({ ...acc, [key]: slice.reducer }),
    { actionType },
  );
  return combineReducers(reducers);
}

const reducer = combineSlices(mergedSlices);
const store = configureStore({ reducer });

export type Actions = NameObjectFromSlicessMapObject<typeof mergedSlices>;
export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;
export type AnyDispatch = DispatchA;
// eslint-disable-next-line no-unused-vars
export type SubscribeHandler = (state: State, dispatch: Dispatch) => void;
type SliceByName<M, K extends string> = M extends Slice<any, any, K> ? M : never;
type Method<R extends string> = keyof MemberFromSlice<SliceByName<SliceFromSlicesMapObject<typeof mergedSlices>, R>, 'actions'>;
type ActionPath<T extends Actions> = [actions: T, method?: Method<T>];
export type StateSubscriber = <T extends Actions>(
  // eslint-disable-next-line no-unused-vars
  handler: SubscribeHandler,
  // eslint-disable-next-line no-unused-vars
  hookActionPath: ActionPath<T>,
  // eslint-disable-next-line no-unused-vars
  once?: boolean,
) => void;
export type ListenerHandler<T = State, U = Dispatch, V = any, W = any, X = any> = (
  // eslint-disable-next-line no-unused-vars
  state: T, dispatch: U, arg1: V, arg2: W, arg3: X
) => void;
// eslint-disable-next-line no-unused-vars
export type StateListener = <T, U, V>(handler: ListenerHandler<State, Dispatch, T, U, V>)
  // eslint-disable-next-line no-unused-vars
  => (arg1?: T, arg2?: U, arg3?: V) => ReturnType<ListenerHandler<State, Dispatch, T, U, V>>;

function compareActionPaths(
  firedActionType: string,
  hookActionPath?: string[],
) {
  if (!hookActionPath || hookActionPath.length === 0) {
    return true;
  }
  return firedActionType.concat('/').startsWith(`${hookActionPath.join('/')}/`);
}

function subscriber<T extends Actions>(
  handler: SubscribeHandler,
  hookActionPath?: ActionPath<T>,
  once: boolean = false,
) {
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    const firedActionType = (state as any).actionType as string;
    // eslint-disable-next-line no-console
    console.log(firedActionType);
    if (compareActionPaths(firedActionType, hookActionPath as string[])) {
      handler(state, store.dispatch);
      if (once) {
        unsubscribe();
      }
    }
  });
}

function listener(handler: ListenerHandler) {
  return (arg1: any, arg2?: any, arg3?: any) => {
    handler(store.getState(), store.dispatch, arg1, arg2, arg3);
  };
}

mergedConnects.map((connect) => connect(subscriber, listener, store.dispatch));
