import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function SigningCanvas(props) {
  const ref = React.useRef();

  const [ctx, setCtx] = useState({});
  const [canvasData, setCanvasData] = useState({
    canvasWidth: 200,
    canvasHeight: 200,
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
    // e.offsetX = null;
    // e.offsetY = null;
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
        padding: "50px",
        backgroundColor: "white",
        borderRadius: "7px",
        boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)"
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
      <button className={styles.button} onClick={submitCanvas}>
        Sign
      </button>
    </div>
  );
}