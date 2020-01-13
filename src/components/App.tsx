import React from 'react';
import AddTodo from './AddTodo';
import TodoList from './TodoList';
// import '../App.css';
import Title from "../containers/Title";
import Folder from "../containers/Folder";

const App = ({ store }: any) => (
	<div>
        <Title />
        <Folder title="TypeScript" id="id1" icon="React" />
        <Folder title="React" id="id2" icon="React" />
		{/* <AddTodo />
		<TodoList /> */}
	</div>
);

export default App;
