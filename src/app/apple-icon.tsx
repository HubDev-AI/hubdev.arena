import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          borderRadius: 32,
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 72,
            fontWeight: 900,
            fontFamily: "monospace",
            letterSpacing: 4,
            marginTop: -10,
          }}
        >
          HA
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 16,
            right: 16,
            height: 10,
            background: "#00FF41",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
