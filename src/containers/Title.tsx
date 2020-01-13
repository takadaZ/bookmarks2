import React from "react";
import { connect, useDispatch } from "react-redux";

const Title = ({ folderName }: any) => {
  console.log('folderName', folderName);
  return <div>{folderName}</div>;
}

const mapStateToProps = (state: any) => {
  console.log('mapStateToProps', state);
  return {
	  folderName: state.folderName
  };
}

export default connect(
  mapStateToProps
)(Title);
