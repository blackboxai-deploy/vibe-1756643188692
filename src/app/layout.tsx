import './globals.css'

export const metadata = {
  title: 'B.N. College - BCA Department Attendance System',
  description: 'Student Attendance Management System for BCA Department',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}