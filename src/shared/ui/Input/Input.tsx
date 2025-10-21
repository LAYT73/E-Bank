import "./Input.module.scss";
import React from "react";

interface IInputProps {
  children: React.ReactNode;
}

const Input: React.FC<IInputProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Input;
