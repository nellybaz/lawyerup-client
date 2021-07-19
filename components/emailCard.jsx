import styles from "../styles/Home.module.css";
import { useState } from "react";

export default function EmailCard(props) {
  const [emails, setEmails] = useState({ ownerEmail: "", coSignerEmail: "" });

  const handleEmailInput = (event, key) => {
    const value = event.target.value;

    if (key == "owner") {
      setEmails({ ...emails, ownerEmail: value });
    } else {
      setEmails({ ...emails, coSignerEmail: value });
    }
  };
  return (
    <div
      style={{
        position: "absolute",
        padding: "50px",
        backgroundColor: "white",
        borderRadius: "7px",
        boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)",
      }}
    >
      <h2>Send PDF Document to emails</h2>
      <input
        placeholder="Enter your email"
        onChange={(e) => {
          handleEmailInput(e, "owner");
        }}
      />
      <input
        placeholder="Enter co-signer's email"
        onChange={(e) => {
          handleEmailInput(e, "coSigner");
        }}
      />

      <br />
      <br />
      <button
        className={styles.button}
        onClick={() => {
          console.log(emails);
          props.send(emails.ownerEmail, emails.coSignerEmail);
        }}
      >
        Send
      </button>

      <button className={styles.button} onClick={props.cancel}>
        Cancel
      </button>
    </div>
  );
}
