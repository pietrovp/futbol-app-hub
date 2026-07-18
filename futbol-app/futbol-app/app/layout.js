import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Gol Caracas FC | Fútbol en Barquisimeto",
  description: "Únete a partidos de fútbol organizados en las mejores canchas de Barquisimeto",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      {/* Cambiamos a fondo claro, texto oscuro y acentos verdes */}
      <body className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-green-500 selection:text-white">
        <Navbar />
        <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}