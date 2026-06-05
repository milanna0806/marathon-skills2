// pages/login.js
import { signIn, getSession } from "next-auth/react";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#1a1a2e",
        border: "1px solid #2a2a4a",
        borderRadius: "16px",
        padding: "48px",
        textAlign: "center",
        maxWidth: "400px",
        width: "90%",
      }}>
        <div style={{
          width: 56, height: 56,
          background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 900, color: "#fff",
          margin: "0 auto 24px",
        }}>M</div>

        <h1 style={{ color: "#e8eaf6", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
          Marathon Skills 2026
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 32px" }}>
          Казахстан · 15 июня 2026 · Кокшетау
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: "#fff",
            color: "#1f2937",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Войти через Google
        </button>

        <p style={{ color: "#4b5563", fontSize: 12, marginTop: 20 }}>
          🔒 Безопасный вход через Google OAuth 2.0
        </p>
      </div>
    </div>
  );
}

// Если уже залогинен — редирект на главную
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
}
