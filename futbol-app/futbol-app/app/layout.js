import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Partidos BQTO",
  description: "Encuentra partidos de fútbol en Barquisimeto",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
