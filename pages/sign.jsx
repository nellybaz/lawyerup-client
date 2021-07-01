import styles from "../styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import SignaturePad from "react-signature-canvas";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function sign() {
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

  const [pdfBuffer, setPdfBuffer] = useState(new ArrayBuffer(0));

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
        y: paintPoint.y,
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

    const pdfBytes = await pdfDoc.save();

    setPdfBuffer(pdfBytes);
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
    currentPage <= totalPages
      ? setCurrentPage(currentPage + 1)
      : alert("End of document");

  return (
    <div className={styles.container}>
      <div
        style={{
          display: "flex",
        }}
      >
        <button className={styles.prevButton} onClick={handlePrev}>
          Prev
        </button>
        <button
          className={styles.prevButton}
          onClick={() => {
            setMode("edit");
          }}
        >
          Edit
        </button>
        <button
          className={styles.nextButton}
          onClick={() => {
            setMode("sign");
          }}
        >
          Sign
        </button>
        <button className={styles.nextButton} onClick={handleNext}>
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
      {/* <button 
        className={styles.signButton}
        onClick={toggleSignBox}
        >Sign</button>
      {isSigning && ( 
        <div className = {styles.sigCanvas}><SignaturePad penColor='black'
        />
        </div>
      )} */}

      {showModal && mode == "edit" && (
        <InputField
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
    </div>
  );
}

function InputField(props) {
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
      <button>Sign</button>
    </div>
  );
}

function SigningCanvas(props) {
  const ref = React.useRef();

  const [ctx, setCtx] = useState({});
  const [canvasData, setCanvasData] = useState({
    canvasWidth: 400,
    canvasHeight: 400,
  });

  const [shouldDraw, setShouldDraw] = useState(false);

  useEffect(() => {
    setCtx(ref.current.getContext("2d"));
  }, [shouldDraw]);

  const submitCanvas = () => {
    let canvasImage = ref.current.toDataURL("image/png");
    props.onClick(canvasImage);
  };

  const clearCanvas = () => {
    // this.$refs.canvas
    //   .getContext("2d")
    //   .clearRect(0, 0, canvasData.canvasWidth, canvasData.canvasHeight);
  };

  const startDrawing = () => {
    console.log("start draw called");
    setShouldDraw(true);
  };

  const stopDrawing = (event) => {
    console.log("called stop");
    const e = event.nativeEvent;
    setShouldDraw(false);
    const ctx1 = ref.current.getContext("2d");
    // ctx1.lineTo(null, null);
    ctx1.closePath();
    e.offsetX = null;
    e.offsetY = null;
  };

  const getTouchPos = (canvasDom, touchEvent) => {
    var rect = canvasDom.getBoundingClientRect();
    return {
      x: touchEvent.touches[0].clientX - rect.left,
      y: touchEvent.touches[0].clientY - rect.top,
    };
  };

  const drawOnCanvas = (event) => {
    const e = event.nativeEvent;
    const ctx1 = ref.current.getContext("2d");
    if (!shouldDraw) return;
    ctx1.lineWidth = 4;
    ctx1.lineCap = "round";

    ctx1.lineTo(e.offsetX, e.offsetY);

    ctx1.stroke();
    ctx1.beginPath();

    ctx1.moveTo(e.offsetX, e.offsetY);
  };

  const drawOnCanvasMobile = (e) => {
    // const ctx = window.xyz.$refs.canvas.getContext("2d");
    // if (!this.shouldDraw) return;
    // ctx.lineWidth = 4;
    // ctx.lineCap = "round";
    // e.offsetX = this.getTouchPos(window.xyz.$refs.canvas, e)["x"];
    // e.offsetY = this.getTouchPos(window.xyz.$refs.canvas, e)["y"];
    // ctx.lineTo(e.offsetX, e.offsetY);
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.moveTo(e.offsetX, e.offsetY);
  };

  return (
    <div
      style={{
        position: "absolute",
        // left: "40vw",
        // top: "10vh",
        padding: "50px",
        backgroundColor: "white",
        // opacity: 0.8,
        borderRadius: "7px",
      }}
    >
      <div className={styles.sigCanvas2}>
        <canvas
          id="my-canvas"
          onTouchStart={() => {}}
          onTouchMove={() => {}}
          onTouchEnd={() => {}}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={drawOnCanvas}
          width={canvasData.canvasWidth}
          height={canvasData.canvasHeight}
          ref={ref}
        ></canvas>
      </div>
      <button onClick={submitCanvas}>Sign</button>
    </div>
  );
}
