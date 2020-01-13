import * as React from "react";
import { render } from "react-dom";
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import App from './components/App';
import rootReducer from './reducers';

import { folderName } from './modules/Foler'
const store = createStore(folderName);
// const store = createStore(rootReducer);

render(
	<Provider store={store}>
		<App store={store} />
	</Provider>,
	document.getElementById('root')
);

// render(
// 	<App />,
// 	document.getElementById('root')
// );

// import { createStore } from 'redux';
// import { Provider, useSelector, connect } from 'react-redux';

// import { folderReducer } from './modules/Foler'
// import { Folder } from "./containers/Folder";
// import { Title } from "./containers/Title";

// const store = createStore(
//   folderReducer,
//   { folderName: '' },
// );

// // import { connect } from 'react-redux';

// // store.subscribe(_ => )

// // const store = createStore(reducer);

// render(
//   <Provider store={store}>
//     {/* <App /> */}
//     <Title store={store} />
//     <Folder title="TypeScript" id="id1" icon="React" />
//     <Folder title="React" id="id2" icon="React" />
//   </Provider>,
//   document.querySelector("#root")
// );

// // export default connect()(Folder);
