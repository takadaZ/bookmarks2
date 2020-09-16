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
type ReducerFromSlice<M, K extends keyof M> = M[K];
type SliceFromSlicesMapObject<M> = M extends {
  // eslint-disable-next-line no-unused-vars
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
>;

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
// export type States = keyof typeof slices;
export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;
export type AnyDispatch = DispatchA;
// eslint-disable-next-line no-unused-vars
export type SubscribeHandler = (state: State, dispatch: Dispatch) => void;
// eslint-disable-next-line no-unused-vars
export type StateSubscriber = (handler: SubscribeHandler, actionTypes: Actions[]) => void;
export type ListenerHandler<T = State, U = Dispatch, V = any, W = any, X = any> = (
  // eslint-disable-next-line no-unused-vars
  state: T, dispatch: U, arg1: V, arg2: W, arg3: X
) => void;
// eslint-disable-next-line no-unused-vars
export type StateListener = <T, U, V>(handler: ListenerHandler<State, Dispatch, T, U, V>)
 // eslint-disable-next-line no-unused-vars
 => (arg1?: T, arg2?: U, arg3?: V) => ReturnType<ListenerHandler<State, Dispatch, T, U, V>>;

function subscriber(handler: SubscribeHandler, actionTypes: Actions[] = []) {
  store.subscribe(() => {
    const state = store.getState();
    // console.log((state as any).actionType);
    if (actionTypes.find((actionTypeRoot) => (state as any).actionTypeRoot.startsWith(`${actionTypeRoot}/`))) {
      handler(state, store.dispatch);
    }
  });
}

function listener(handler: ListenerHandler) {
  return (arg1: any, arg2?: any, arg3?: any) => {
    handler(store.getState(), store.dispatch, arg1, arg2, arg3);
  };
}

mergedConnects.map((connect) => connect(subscriber, listener, store.dispatch));
