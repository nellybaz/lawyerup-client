import React from "react";

import { Document, Page } from "react-pdf/dist/esm/entry.webpack";

import { pdfjs } from "react-pdf";
import axios from "axios";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfViewer = ({
  url,
  width,
  pageNumber,
  pdfViewerRef,
  height,
  docRef,
  loadSuccess
}: {
  url: any;
  width: number;
  pageNumber: any;
  pdfViewerRef: any;
  height: number;
  docRef: any;
  loadSuccess:any
}) => (
  <Document
    file={{ data: url }}
    onLoadSuccess={loadSuccess}
    onItemClick={(e) => {
      console.log(e, pdfViewerRef);
    }}
    inputRef={pdfViewerRef}
  >
    <Page
      pageNumber={pageNumber}
      // width={width}
      canvasRef={docRef}
      height={height}
    />
  </Document>
);

export default PdfViewer;
