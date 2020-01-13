import React from 'react';
import { connect } from 'react-redux';
import Todo from './ToDo';

const TodoList = ({ todos }: any) => {
    return (
        <ul className="todo-list">
            {todos.map((todo: any) =>
                <Todo
                    key={todo.id}
                    {...todo}
                />
            )}
        </ul>
    );
}

const mapStateToProps = (state: any) => {
    console.log(state);
    return {
    	todos: state.todos
    };
}

export default connect(
	mapStateToProps
)(TodoList);
