
import React, { useState } from "react";
import styles from "../styles/Home.module.css";

export default function EditField(props) {
  const [value, setValue] = useState("");
  return (
    <div
      style={{
        position: "absolute",
        left: "40vw",
        top: "10vh",
        padding: "50px",
        backgroundColor: "black",
        opacity: 0.8,
        borderRadius: "7px",
        boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)"
      }}
    >
      <input
        type="text"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder="Enter text to paint"
      />{" "}
      <br /> <br />
      <button className={styles.button} onClick={() => props.onClick(value)}>
        Okay
      </button>
      {/* <button className={styles.button}>Sign</button> */}
    </div>
  );
}