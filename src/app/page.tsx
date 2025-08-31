"use client";

export default function Home() {
  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      margin: 0,
      padding: "40px 20px",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "white",
        borderRadius: "15px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        padding: "40px",
        textAlign: "center",
        maxWidth: "500px",
        width: "100%"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #3498db, #2c3e50)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "24px",
          color: "white",
          margin: "0 auto 20px"
        }}>
          BNC
        </div>
        <h1 style={{
          color: "#2c3e50",
          marginBottom: "10px",
          fontSize: "2rem"
        }}>
          B.N. College (Autonomous)
        </h1>
        <h2 style={{
          color: "#7f8c8d",
          marginBottom: "30px",
          fontWeight: 400
        }}>
          BCA Department Portal
        </h2>
        <p style={{
          color: "#5a6c7d",
          marginBottom: "30px",
          lineHeight: 1.6
        }}>
          Welcome to the BCA Department Student Attendance Management System. 
          This portal allows faculty to mark attendance, generate reports, and manage student records efficiently.
        </p>
        <a 
          href="/attendance" 
          style={{
            background: "linear-gradient(135deg, #3498db, #2980b9)",
            color: "white",
            padding: "15px 30px",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
            transition: "all 0.3s",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #2980b9, #2573a7)";
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(41, 128, 185, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #3498db, #2980b9)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
          }}
        >
          Access Attendance System
        </a>
      </div>
    </div>
  );
}