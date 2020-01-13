import { createStore, Action } from 'redux';
import { connect } from 'react-redux';

// export interface Action {
//   type: string;
//   folderName: string;
// }

const OPEN_FOLDER = 'OPEN_FOLDER';

// Action Creator
export function open(folderName: string) {
  // Action
  return {
    type: OPEN_FOLDER,
    folderName,
  };
}

// Reducer
export const folderName = (state: any = { folderName: '' }, action: any): any => {
  console.log(state, action);
  switch (action.type) {
    case 'OPEN_FOLDER':
      return { ...state,
        folderName: action.folderName
      };
    default:
      return state;
  }
}

// import { connect } from 'react-redux';
// import rootReducer from './reducers';

// export default createStore(
//   folderReducer,
//   { folderName: '' },
// );
