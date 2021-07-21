import styles from "../styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import SigningCanvas from "../components/signingCanvas";
import EditField from "../components/editField";
import EmailCard from "../components/emailCard";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function Sign() {
  const pdfViewerRef = React.useRef();
  const pdfViewerDocRef = React.useRef();
  const [windowHeight, setWindowHeight] = useState(1000);
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
  const [paintPoint, setPaintPoint] = useState({ x: 50, y: 600 });
  const [clickPoint, setClickPoint] = useState({ x: 50, y: 600 });
  const [showModal, setShowModal] = useState(false);
  const [paintText, setPainText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [mode, setMode] = useState("edit");
  const [isImage, setIsImage] = useState(false);
  const [showEmailCard, setShowEmailCard] = useState(false);

  const [pdfBuffer, setPdfBuffer] = useState(new ArrayBuffer(0));
  const [pdfBase64, setPdfBase64] = useState("");

  const getPdfBuffer = async () => {
    if (pdfBuffer.byteLength > 0) return pdfBuffer;

    const url = "https://lawyeredup-api.herokuapp.com/api/file";

    const resp = await axios.get(url, { responseType: "arraybuffer" });

    const fetchedPdfData = await resp.data;
    setPdfBuffer(fetchedPdfData);
    return fetchedPdfData;
  };

  const getPdf = async (data) => {
    const fetchedPdfData = await getPdfBuffer();
    const pdfDoc = await PDFDocument.load(fetchedPdfData);

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const page = pdfDoc.getPages()[currentPage - 1];

    setTotalPages(pdfDoc.getPages().length);

    const { width, height } = page.getSize();
    setPdfSize({ width, height });

    const fontSize = 13;
    const padding = 70;

    console.log({ width, height });
    page.drawText("right", {
      x: width - padding,
      y: height - padding,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    page.drawText("left", {
      x: padding,
      y: height - padding,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    if (data && data.x && data.y && data.text) {
      if (isImage) {
        const jpgImage = await pdfDoc.embedPng(paintText);
        const jpgDims = jpgImage.scale(0.3);

        page.drawImage(jpgImage, {
          x: paintPoint.x,
          y: paintPoint.y - 20,
          width: jpgDims.width,
          height: jpgDims.height,
          // rotate: degrees(30),
          // opacity: 0.75,
        });
      } else {
        const xPadding = (window.innerWidth / window.innerHeight) * 10;
        const yPadding = (window.innerWidth / window.innerHeight) * 12;
        console.log({
          windowWidth: window.innerWidth,
          pageWidth: width,
          widthDiff: window.innerWidth - width,
          windowHeight: window.innerHeight,
          pageHeight: height,
          heightDiff: window.innerHeight - height,
        });

        page.drawText(data.text, {
          x: data.x,
          y: data.y,
          // x: data.x - parseInt(xPadding),
          // y: height - data.y + parseInt(yPadding),
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
      }
    }

    const pdfBase64 = await pdfDoc.saveAsBase64();
    const pdfBytes = await pdfDoc.save();

    setPdfBuffer(pdfBytes);
    setPdfBase64(pdfBase64);
    return pdfBytes;
  };

  useEffect(() => {
    console.log("use effect called");
    setWindowHeight(window.innerHeight - 100);
    getPdf(null)
      .then((_) => {})
      .catch(console.log);
  }, []);

  const PdfViewer = dynamic(() => import("../components/pdfViewer"), {
    ssr: false,
  });

  const mouseMoveHandler = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    setClickPoint({
      x: x,
      y: y,
    });
    setShowModal(true);
  };

  const handlePrev = () =>
    currentPage > 1
      ? setCurrentPage(currentPage - 1)
      : alert("Start of document");
  const handleNext = () =>
    currentPage <= totalPages - 1
      ? setCurrentPage(currentPage + 1)
      : setShowEmailCard(true);

  const emailSendingHandler = async (owner, coSigner) => {
    try {
      const url = "https://lawyeredup-api.herokuapp.com/api/sendEmail";
      await axios.post(url, { owner, coSigner, attachment: pdfBase64 });
      alert("Emails sent successfully");
    } catch (error) {
      console.log(error);
      alert("Emails sending failed, please retry");
    }
  };

  return (
    <div className={styles.container}>
      <div
        style={{
          display: "flex",
        }}
      >
        <button className={styles.button} onClick={handlePrev}>
          Prev
        </button>
        <button
          className={styles.button}
          onClick={() => {
            setMode("edit");
          }}
        >
          Edit {clickPoint.x}, {clickPoint.y}
        </button>
        <button
          className={styles.button}
          onClick={() => {
            setMode("sign");
          }}
        >
          Sign
        </button>
        <button className={styles.button} onClick={handleNext}>
          Next
        </button>
      </div>

      <div
        style={{ border: "1px solid grey", padding: "0" }}
        // onClick={mouseMoveHandler}
      >
        <PdfViewer
          url={pdfBuffer}
          pageNumber={currentPage}
          width={pdfSize.width}
          pdfViewerRef={pdfViewerRef}
          height={windowHeight}
          docRef={pdfViewerDocRef}
          loadSuccess={() => {
            console.log("pdf viewer loaded");
            if (pdfViewerRef && pdfViewerRef.current) {
              pdfViewerRef.current.addEventListener(
                "mousedown",
                (e) => {
                  console.log(e.clientX, e.clientY);
                  mouseMoveHandler(e);
                },
                false
              );
            }
          }}
        />
      </div>

      {showModal && mode == "edit" && (
        <EditField
          onClick={(e) => {
            const boundingClientRect =
              pdfViewerRef.current.getBoundingClientRect();
            console.log({ boundingClientRect });

            // const x = clickPoint.x - boundingClientRect.left;
            // const y = clickPoint.y - boundingClientRect.top;
            // console.log(clickPoint.y,  boundingClientRect.top);
            // console.log("x: " + x + " y: " + y);

            getPdf({
              text: e,
              x: clickPoint.x,
              y: clickPoint.y,
            })
              .then((_) => {
                setShowModal(false);
              })
              .catch(console.log);
          }}
        />
      )}

      {showModal && mode == "sign" && (
        <SigningCanvas
          onClick={(e) => {
            console.log(e);
            setPainText(e);
            setPaintPoint(clickPoint);
            setShowModal(false);
            setIsImage(true);
          }}
        />
      )}

      {showEmailCard && (
        <EmailCard
          send={emailSendingHandler}
          cancel={() => {
            setShowEmailCard(false);
          }}
        />
      )}
    </div>
  );
}
