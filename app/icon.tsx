import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #0c1018 0%, #05070c 100%)",
          color: "#f7c948",
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -8
        }}
      >
        P
      </div>
    ),
    size
  );
}
