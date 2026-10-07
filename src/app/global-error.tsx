"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#fafaf8" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 28 }}>משהו השתבש. נסו שוב.</h1>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, border: 0, background: "#0e7c66", color: "#fff", fontSize: 16, cursor: "pointer" }}>
            ניסיון נוסף
          </button>
        </div>
      </body>
    </html>
  );
}
