export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      © {year} Sva prava zadržana.
    </footer>
  );
}
