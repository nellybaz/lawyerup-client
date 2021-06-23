import styles from "../styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function sign() {
  const pdfViewerRef = useRef<HTMLDivElement>(null);
  const [pdfData, setPdfData] = useState<Uint8Array>();
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
  const [paintPoint, setPaintPoint] = useState({ x: 50, y: 600 });
  const [clickPoint, setClickPoint] = useState({ x: 50, y: 600 });
  const [showInput, setShowInput] = useState(false);
  const [paintText, setPainText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSigning, setIsSigning] = useState(false);

  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer>(new ArrayBuffer(0));

  const getPdfBuffer = async () => {
    if (pdfBuffer.byteLength > 0) return pdfBuffer;

    const url = "http://localhost:8000/api/file";

    const resp = await axios.get(url, { responseType: "arraybuffer" });

    const fetchedPdfData = await resp.data;
    setPdfBuffer(fetchedPdfData);
    return fetchedPdfData;
  };
  const getPdf = async () => {
    const fetchedPdfData = await getPdfBuffer();
    const pdfDoc = await PDFDocument.load(fetchedPdfData);

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const page = pdfDoc.getPages()[currentPage-1];

    const { width, height } = page.getSize();
    setPdfSize({ width, height });

    const fontSize = 13;
    page.drawText(paintText, {
      x: paintPoint.x,
      y: paintPoint.y,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    setPdfBuffer(pdfBytes)
    return pdfBytes;
  };

  useEffect(() => {
    getPdf()
      .then((data) => {
        setPdfData(data);
      })
      .catch(console.log);
  }, [paintText]);

  const PdfViewer = dynamic(() => import("../components/pdfViewer"), {
    ssr: false,
  });

  const mouseMoveHandler = (e: any) => {
    const x = e.clientX;
    const y = e.clientY;
    const widthSpace = (window.innerWidth - pdfSize.width) / 2;
    const heightSpace = (window.innerHeight - pdfSize.height) / 2;

    const padding = -35;
    setClickPoint({
      x: x - widthSpace,
      y: pdfSize.height - padding - (y - heightSpace),
    });
    setShowInput(true);
  };

  const handlePrev = () => currentPage > 1 ? setCurrentPage(currentPage - 1) : console.log("start of doc");

  const handleNext = () =>  {
    setCurrentPage(currentPage + 1);
}

const toggleSignBox = () =>  {
  setIsSigning(true);
}

  return (
    <div className={styles.container}>
    <div
      style={{
        display: "flex",
      }}> 
      <button 
        className={styles.prevButton} 
        onClick={handlePrev}>Prev</button>
      <h1>Editing Startup NDA</h1>
      <button
        className={styles.nextButton} 
        onClick={handleNext}>Next</button></div>

      <div
        style={{ border: "1px solid grey", padding: "0", }}
        onClick={mouseMoveHandler}
      >
        
  {isSigning ? <SignatureCanvas penColor='green'
    canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} />: console.log("Not signing")}
        <PdfViewer
          url={pdfData}
          pageNumber={currentPage}
          width={pdfSize.width}
          ref={pdfViewerRef}
        />
      </div>
      <button 
        className={styles.signButton}
        onClick={toggleSignBox}
        >Sign</button>

      {showInput && (
        <InputField
          onClick={(e: string) => {
            setPainText(e);
            setPaintPoint(clickPoint);
            setShowInput(false);
          }}
        />
      )}
    </div>
  );
}

function InputField(props: any) {
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
      }}
    >
      <input
        type="text"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder="Enter text to paint"
      />
      <button onClick={() => props.onClick(value)}>Okay</button>
    </div>
  );
}
