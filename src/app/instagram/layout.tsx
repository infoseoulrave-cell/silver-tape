export default function InstagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#111' }}>
      {children}
    </div>
  );
}
