import React from 'react';

import {
  Document, Page,
} from 'react-pdf/dist/esm/entry.webpack';

import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


const PdfViewer = ({url, width, pageNumber,ref, height}:{url:any, width:number, pageNumber:any, ref:any, height:number}) => (
  <Document 
  file={{data:url}}
  onLoadSuccess={(p:any)=>{console.log(p.numPages)
  }}
  inputRef={ref}
  onItemClick={(e)=>{console.log(e);
  }}
  >
    <Page
      pageNumber={pageNumber}
      // width={width}
      height={height}
      
    />
  </Document>
);

export default PdfViewer;