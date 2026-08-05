"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>The application failed to start</h1>
          <p style={{ color: "#5b6673", marginTop: "0.75rem" }}>
            This is a root-level failure. Reloading may help; if it persists the deployment needs
            attention.
          </p>
          {error.digest ? (
            <p style={{ color: "#5b6673", fontFamily: "monospace", fontSize: "0.75rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #c9d1da",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
