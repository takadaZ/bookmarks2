import React from "react";
import { connect, useDispatch } from "react-redux";

// export interface FolderProps {
//   id: string;
//   title: string;
//   icon: string;
// }

function updateNameAction(title: any) {
  // console.log(e);
  return { type: 'OPEN_FOLDER', folderName: title };
}

const Folder = ({ id, title, dispatch }: any) => {
  // console.log(dispatch);
  // const dispatch2 = useDispatch();
  return (
    <div>
        <input
          type="checkbox"
          id={id}
          onChange={e => dispatch(updateNameAction(title))}
        />
        <label htmlFor={id}>{title}</label>
        <ul></ul>
    </div>
  );
}

// Folder.defaultProps = {
//   id: 'id1',
// };

export default connect()(Folder);

// connect(
//   mapStateToProps,
//   { updateNameAction },
// )(Folder);
