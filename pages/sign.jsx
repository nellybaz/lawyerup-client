import React, { useRef, useEffect } from "react";
import styles from "../styles/Home.module.css";
import axios from "axios";
import { Base64 } from "js-base64";
import { withRouter } from "next/router";

function PdfEditor(props) {
  const viewerDiv = useRef(null);

  const sendEmail = async (pdfBase64) => {
    try {
      const url = "https://lawyeredup-api.herokuapp.com/api/sendEmail";

      const { owner, coSigner } = props.router.query;
      
      await axios.post(url, {
        // owner: "nelson.bassey111@gmail.com",
        // coSigner: "nellybaz10@gmail.com",
        owner,
        coSigner,
        attachment: pdfBase64,
      });
    } catch (error) {
      console.log(error);
      alert("Emails sending failed, please retry");
    }
  };
  useEffect(async () => {
    const WebView = (await import("@pdftron/webviewer")).default;
    WebView(
      {
        path: "lib",
        initialDoc:
          "https://res.cloudinary.com/nellybaz/image/upload/v1626699273/nda2.pdf",
      },
      viewerDiv.current
    ).then((instance) => {
      const { documentViewer, annotationManager } = instance.Core;

      documentViewer.addEventListener("documentLoaded", async () => {
        console.log("Downloaded");
      });

      instance.UI.setHeaderItems((header) => {
        header.delete(8);
        header.push({
          type: "actionButton",
          img: '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path style="fill:#4DBBEB;" d="M507.607,4.395c-4.242-4.245-10.61-5.551-16.177-3.32l-482,192.798 c-5.516,2.205-9.209,7.458-9.42,13.394c-0.211,5.936,3.101,11.438,8.444,14.029l190.067,92.182l92.182,190.068 c2.514,5.184,7.764,8.454,13.493,8.454c0.178,0,0.357-0.003,0.536-0.01c5.936-0.211,11.188-3.904,13.394-9.419L510.928,20.573 C513.156,15.002,511.85,8.638,507.607,4.395z"/><path style="fill:#2488FF;" d="M507.607,4.395L198.522,313.477l92.182,190.068c2.514,5.184,7.764,8.454,13.493,8.454 c0.178,0,0.357-0.003,0.536-0.01c5.936-0.211,11.188-3.904,13.394-9.419L510.928,20.573C513.156,15.002,511.85,8.638,507.607,4.395 L507.607,4.395z"/></svg>',
          onClick: async () => {
            const doc = documentViewer.getDocument();
            const xfdfString = await annotationManager.exportAnnotations();
            const options = { xfdfString };
            const data = await doc.getFileData(options);
            const arr = new Uint8Array(data);

            const b64encoded = Base64.fromUint8Array(arr);
            await sendEmail(b64encoded);
            alert("Thanks for using LawyeredUp. Email sent 😊");
          },
        });
      });
    });
  }, []);

  return (
    <div className="container">
      <div className={styles.webview} ref={viewerDiv}></div>
    </div>
  );
}

export default withRouter(PdfEditor);
