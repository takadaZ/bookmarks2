import React from 'react';
import { connect } from 'react-redux';
import { addTodo } from '../actions';

const AddTodo = ({ dispatch }: any) => {
    console.log(dispatch);
	let input: any;
	return (
		<div>
			<form onSubmit={(event) => {
				event.preventDefault();
				const text = input.value.trim();
				input.value = '';
				if (!text) {
					return;
				}
				dispatch(addTodo(text));
			}}>
				<input ref={(element) => input = element} />
				<button type="submit">
					Add Todo
				</button>
			</form>
		</div>
	);
};

export default connect()(AddTodo);

// export default AddTodo;
// export default connect()(AddTodo);
// const AddTodo = () => {
// 	let input: any;
// 	return (
// 		<div>
// 			<form onSubmit={(event) => {
// 				event.preventDefault();
// 				const text = input.value.trim();
// 				input.value = '';
// 				if (!text) {
// 					return;
// 				}
// 				console.log(text);  // 確認用
// 			}}>
// 				<input ref={(element) => input = element} />
// 				<button type="submit">
// 					Add Todo
// 				</button>
// 			</form>
// 		</div>
// 	);
// };

// export default AddTodo;
