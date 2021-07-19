import styles from "../styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import SigningCanvas from "../components/signingCanvas";
import EditField from "../components/editField";
import EmailCard from "../components/emailCard";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function Sign() {
  const pdfViewerRef = useRef(null);
  const [pdfData, setPdfData] = useState();
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
  const [pdfBase64, setPdfBase64] = useState("")

  const getPdfBuffer = async () => {
    if (pdfBuffer.byteLength > 0) return pdfBuffer;

    const url = "http://localhost:8123/api/file";

    const resp = await axios.get(url, { responseType: "arraybuffer" });

    const fetchedPdfData = await resp.data;
    setPdfBuffer(fetchedPdfData);
    return fetchedPdfData;
  };

  const getPdf = async () => {
    const fetchedPdfData = await getPdfBuffer();
    const pdfDoc = await PDFDocument.load(fetchedPdfData);

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const page = pdfDoc.getPages()[currentPage - 1];

    setTotalPages(pdfDoc.getPages().length);

    const { width, height } = page.getSize();
    setPdfSize({ width, height });

    const fontSize = 13;

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
      page.drawText(paintText, {
        x: paintPoint.x,
        y: paintPoint.y,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
    }

    
    const pdfBase64 = await pdfDoc.saveAsBase64()
    const pdfBytes = await pdfDoc.save();

    setPdfBuffer(pdfBytes);
    setPdfBase64(pdfBase64)
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

  const mouseMoveHandler = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const widthSpace = (window.innerWidth - pdfSize.width) / 2;
    const heightSpace = (window.innerHeight - pdfSize.height) / 2;

    const padding = -35;
    setClickPoint({
      x: x - widthSpace,
      y: pdfSize.height - padding - (y - heightSpace),
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

      const url = "http://localhost:8123/api/sendEmail";
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
          Edit
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
        onClick={mouseMoveHandler}
      >
        <PdfViewer
          url={pdfData}
          pageNumber={currentPage}
          width={pdfSize.width}
          ref={pdfViewerRef}
        />
      </div>

      {showModal && mode == "edit" && (
        <EditField
          onClick={(e) => {
            setPainText(e);
            setPaintPoint(clickPoint);
            setShowModal(false);
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
