import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          borderRadius: 4,
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 900,
            fontFamily: "monospace",
            letterSpacing: 1,
            marginTop: -2,
          }}
        >
          HA
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 1,
            left: 3,
            right: 3,
            height: 3,
            background: "#00FF41",
            borderRadius: 1,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
