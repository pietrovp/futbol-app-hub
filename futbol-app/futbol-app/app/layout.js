import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "SportHub | Fútbol y Pádel",
  description: "Únete a partidos organizados en las mejores canchas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="bg-[#0a0a0a] text-white font-sans antialiased min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow">
          {children}
        </div>
      </body>
    </html>
  );
}
