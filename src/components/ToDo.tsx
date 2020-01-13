import React from 'react';

const Todo = ({ text }: { text: string }) => (
	<li>
		<span>
			{text}
		</span>
	</li>
);

export default Todo;
