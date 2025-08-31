"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface Student {
  id: string;
  name: string;
}

interface SemesterData {
  subjects: string[];
  students: Student[];
}

interface AttendanceState {
  semester: string;
  subject: string;
  date: string;
  topic: string;
  students: Record<string, { name: string; present: boolean | null }>;
}

interface AttendanceRecord extends AttendanceState {
  id: number;
  savedAt: string;
  presentCount: number;
  absentCount: number;
}

export default function AttendancePage() {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({
    semester: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    students: {}
  });
  const [reportsData, setReportsData] = useState<AttendanceRecord[]>([]);
  const [showReports, setShowReports] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [modals, setModals] = useState({
    save: false,
    pdf: false,
    success: false,
    reset: false,
    delete: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  const REPORTS_PER_PAGE = 5;

  // Sample data
  const semesterData: Record<string, SemesterData> = {
    '1': {
      subjects: ['Programming Fundamentals', 'Mathematics I', 'Digital Logic', 'Communication Skills'],
      students: [
        { id: 'UT-231-162-0001', name: 'Amit Sharma' },
        { id: 'UT-231-162-0002', name: 'Priya Patel' },
        { id: 'UT-231-162-0003', name: 'Rahul Kumar' },
        { id: 'UT-231-162-0004', name: 'Sneha Gupta' },
        { id: 'UT-231-162-0005', name: 'Vikram Singh' },
        { id: 'UT-231-162-0006', name: 'Neha Reddy' },
        { id: 'UT-231-162-0007', name: 'Sanjay Verma' }
      ]
    },
    '2': {
      subjects: ['Data Structures', 'Mathematics II', 'Computer Organization', 'Business Economics'],
      students: [
        { id: 'UT-231-162-0101', name: 'Arun Mehta' },
        { id: 'UT-231-162-0102', name: 'Divya Joshi' },
        { id: 'UT-231-162-0103', name: 'Karan Malhotra' },
        { id: 'UT-231-162-0104', name: 'Neha Reddy' },
        { id: 'UT-231-162-0105', name: 'Sanjay Verma' },
        { id: 'UT-231-162-0106', name: 'Anjali Desai' },
        { id: 'UT-231-162-0107', name: 'Mohit Agarwal' }
      ]
    },
    '3': {
      subjects: ['Database Management', 'Operating Systems', 'Web Technologies', 'Software Engineering'],
      students: [
        { id: 'UT-231-162-0201', name: 'Anjali Desai' },
        { id: 'UT-231-162-0202', name: 'Mohit Agarwal' },
        { id: 'UT-231-162-0203', name: 'Pooja Singh' },
        { id: 'UT-231-162-0204', name: 'Ravi Shastri' },
        { id: 'UT-231-162-0205', name: 'Swati Iyer' },
        { id: 'UT-231-162-0206', name: 'Varun Kumar' },
        { id: 'UT-231-162-0207', name: 'Kavita Joshi' }
      ]
    }
  };

  // Load reports from localStorage on component mount
  useEffect(() => {
    setIsMounted(true);
    const storedReports = localStorage.getItem('attendanceReports');
    if (storedReports) {
      try {
        setReportsData(JSON.parse(storedReports));
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }
  }, []);

  // Handle semester change
  const handleSemesterChange = (semester: string) => {
    const newStudents: Record<string, { name: string; present: boolean | null }> = {};
    
    if (semester && semesterData[semester]) {
      semesterData[semester].students.forEach(student => {
        newStudents[student.id] = {
          name: student.name,
          present: null
        };
      });
    }

    setAttendanceState(prev => ({
      ...prev,
      semester,
      subject: '',
      students: newStudents
    }));
  };

  // Handle attendance marking
  const markAttendance = (studentId: string, present: boolean) => {
    setAttendanceState(prev => ({
      ...prev,
      students: {
        ...prev.students,
        [studentId]: {
          ...prev.students[studentId],
          present
        }
      }
    }));
  };

  // Calculate statistics
  const getStats = () => {
    const total = Object.keys(attendanceState.students).length;
    const present = Object.values(attendanceState.students).filter((s: { name: string; present: boolean | null }) => s.present === true).length;
    const absent = Object.values(attendanceState.students).filter((s: { name: string; present: boolean | null }) => s.present === false).length;
    return { total, present, absent };
  };

  // Show modal
  const showModal = (modalType: keyof typeof modals) => {
    if (modalType === 'save') {
      if (!attendanceState.semester || !attendanceState.subject || !attendanceState.date) {
        showSuccessModal('Please fill all required fields (semester, subject, and date)');
        return;
      }
      
      const { present } = getStats();
      if (present === 0) {
        showSuccessModal('Please mark attendance for at least one student');
        return;
      }
    }
    
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  // Hide modal
  const hideModal = (modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  // Show success modal
  const showSuccessModal = (message: string) => {
    setSuccessMessage(message);
    setModals(prev => ({ ...prev, success: true }));
  };

  // Save attendance
  const saveAttendance = () => {
    hideModal('save');
    
    const { present, absent } = getStats();
    
    const attendanceRecord: AttendanceRecord = {
      ...attendanceState,
      id: Date.now(),
      savedAt: new Date().toISOString(),
      presentCount: present,
      absentCount: absent
    };
    
    const newReportsData = [attendanceRecord, ...reportsData];
    setReportsData(newReportsData);
    localStorage.setItem('attendanceReports', JSON.stringify(newReportsData));
    
    showSuccessModal('Attendance saved successfully!');
  };

  // Generate PDF
  const generatePDF = async () => {
    hideModal('pdf');
    setIsGeneratingPdf(true);
    
    try {
      // Check if jsPDF is available
      if (typeof window === 'undefined' || !(window as any).jspdf) {
        throw new Error('jsPDF library not loaded');
      }

      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();

      // Add header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('B.N. COLLEGE (AUTONOMOUS)', 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text('BCA Department - Attendance Record', 105, 22, { align: 'center' });

      // Add details
      doc.setFontSize(12);
      doc.text(`Semester: ${attendanceState.semester}`, 20, 35);
      doc.text(`Subject: ${attendanceState.subject}`, 20, 42);
      doc.text(`Date: ${attendanceState.date}`, 20, 49);
      if (attendanceState.topic) {
        doc.text(`Topic: ${attendanceState.topic}`, 20, 56);
      }

      // Prepare data for the table
      const tableData: string[][] = [];
      Object.entries(attendanceState.students).forEach(([id, student]: [string, { name: string; present: boolean | null }]) => {
        if (student.present !== null) {
          tableData.push([
            id,
            student.name,
            student.present ? 'Present' : 'Absent'
          ]);
        }
      });

      // Add table
      doc.autoTable({
        startY: 65,
        head: [['Roll No', 'Student Name', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });

      // Add statistics
      const { present, total } = getStats();
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.text(`Summary: ${present} Present, ${total - present} Absent out of ${total} students`, 20, finalY);

      // Generate filename
      const filename = `attendance_${attendanceState.semester}_${attendanceState.subject.replace(/\s+/g, '_')}_${attendanceState.date}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      showSuccessModal('PDF generated and downloaded successfully!');
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      showSuccessModal(`PDF generation failed: ${error.message}. Please refresh the page and try again.`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle PDF generation
  const handleGeneratePdf = () => {
    if (!attendanceState.semester || !attendanceState.subject || !attendanceState.date) {
      showSuccessModal('Please fill all required fields (semester, subject, and date)');
      return;
    }

    const marked = Object.values(attendanceState.students).filter(s => s.present !== null).length;
    if (marked === 0) {
      showSuccessModal('Please mark attendance for at least one student');
      return;
    }

    if (!isLibraryLoaded) {
      showSuccessModal('PDF library not loaded. Please refresh the page and try again.');
      return;
    }

    showModal('pdf');
  };

  // Reset form
  const resetForm = () => {
    hideModal('reset');
    
    setAttendanceState({
      semester: '',
      subject: '',
      date: new Date().toISOString().split('T')[0],
      topic: '',
      students: {}
    });
    
    showSuccessModal('Form has been reset successfully!');
  };

  // Download report
  const downloadReport = async (id: number) => {
    const report = reportsData.find(r => r.id === id);
    if (!report) {
      showSuccessModal('Report not found');
      return;
    }

    try {
      if (typeof window === 'undefined' || !(window as any).jspdf) {
        throw new Error('jsPDF library not loaded');
      }

      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();

      // Add header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('B.N. COLLEGE (AUTONOMOUS)', 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text('BCA Department - Attendance Record', 105, 22, { align: 'center' });

      // Add details
      doc.setFontSize(12);
      doc.text(`Semester: ${report.semester}`, 20, 35);
      doc.text(`Subject: ${report.subject}`, 20, 42);
      doc.text(`Date: ${report.date}`, 20, 49);
      if (report.topic) {
        doc.text(`Topic: ${report.topic}`, 20, 56);
      }

      // Prepare data for the table
      const tableData: string[][] = [];
      Object.entries(report.students).forEach(([id, student]: [string, { name: string; present: boolean | null }]) => {
        if (student.present !== null) {
          tableData.push([
            id,
            student.name,
            student.present ? 'Present' : 'Absent'
          ]);
        }
      });

      // Add table
      doc.autoTable({
        startY: 65,
        head: [['Roll No', 'Student Name', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });

      // Add statistics
      const totalCount = Object.values(report.students).filter((s: { name: string; present: boolean | null }) => s.present !== null).length;
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.text(`Summary: ${report.presentCount} Present, ${totalCount - report.presentCount} Absent out of ${totalCount} students`, 20, finalY);

      // Generate filename
      const filename = `attendance_${report.semester}_${report.subject.replace(/\s+/g, '_')}_${report.date}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      showSuccessModal('PDF downloaded successfully!');
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      showSuccessModal(`PDF generation failed: ${error.message}. Please refresh the page and try again.`);
    }
  };

  // Edit report
  const editReport = (id: number) => {
    const report = reportsData.find(r => r.id === id);
    if (report) {
      setAttendanceState({
        semester: report.semester,
        subject: report.subject,
        date: report.date,
        topic: report.topic,
        students: { ...report.students }
      });
      
      // Remove the report from the list
      const newReportsData = reportsData.filter(r => r.id !== id);
      setReportsData(newReportsData);
      localStorage.setItem('attendanceReports', JSON.stringify(newReportsData));
      
      setShowReports(false);
      showSuccessModal('Attendance record loaded for editing. Please review and save again.');
    }
  };

  // Delete report
  const deleteReport = () => {
    if (recordToDelete) {
      const newReportsData = reportsData.filter(r => r.id !== recordToDelete);
      setReportsData(newReportsData);
      localStorage.setItem('attendanceReports', JSON.stringify(newReportsData));
      hideModal('delete');
      showSuccessModal('Attendance record deleted successfully!');
      setRecordToDelete(null);
    }
  };

  const { total, present, absent } = getStats();

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        onLoad={() => setIsLibraryLoaded(true)}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"
      />
      
      <div style={{
        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        color: '#333',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          margin: '20px 0'
        }}>
          {/* Header */}
          <header style={{
            background: '#2c3e50',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '20px',
              width: '60px',
              height: '60px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              color: '#2c3e50',
              border: '2px solid #3498db'
            }}>
              BNC
            </div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>
              B.N. COLLEGE (AUTONOMOUS)
            </h1>
            <h2 style={{ fontSize: '18px', fontWeight: 400, marginBottom: '10px' }}>
              BCA Department - Student Attendance Portal
            </h2>
          </header>

          {/* Main Form */}
          <div style={{
            padding: '30px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '30px'
          }}>
            {/* Configuration Section */}
            <div style={{
              background: '#f8f9fa',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '5px',
                background: 'linear-gradient(90deg, #3498db, #2c3e50)'
              }} />
              
              <h3 style={{
                color: '#2c3e50',
                marginBottom: '25px',
                paddingBottom: '12px',
                borderBottom: '2px solid #3498db',
                fontSize: '1.4rem'
              }}>
                🔧 Configuration
              </h3>

              {/* Semester Selection */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: '1.05rem'
                }}>
                  🎓 Select Semester *
                </label>
                <select
                  value={attendanceState.semester}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white',
                    color: '#2c3e50'
                  }}
                >
                  <option value="">-- Select Semester --</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                </select>
              </div>

              {/* Subject Selection */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: '1.05rem'
                }}>
                  📚 Select Subject *
                </label>
                <select
                  value={attendanceState.subject}
                  onChange={(e) => setAttendanceState(prev => ({ ...prev, subject: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white',
                    color: '#2c3e50'
                  }}
                >
                  <option value="">-- Select Subject --</option>
                  {attendanceState.semester && semesterData[attendanceState.semester]?.subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: '1.05rem'
                }}>
                  📅 Attendance Date *
                </label>
                <input
                  type="date"
                  value={attendanceState.date}
                  onChange={(e) => setAttendanceState(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white',
                    color: '#2c3e50'
                  }}
                />
              </div>

              {/* Topic Input */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: '1.05rem'
                }}>
                  🎯 Today&apos;s Topic
                </label>
                <input
                  type="text"
                  value={attendanceState.topic}
                  onChange={(e) => setAttendanceState(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Enter today's lecture topic"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white',
                    color: '#2c3e50'
                  }}
                />
              </div>
            </div>

            {/* Student Attendance Section */}
            <div style={{
              background: '#f8f9fa',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '5px',
                background: 'linear-gradient(90deg, #3498db, #2c3e50)'
              }} />
              
              <h3 style={{
                color: '#2c3e50',
                marginBottom: '25px',
                paddingBottom: '12px',
                borderBottom: '2px solid #3498db',
                fontSize: '1.4rem'
              }}>
                👥 Student Attendance
              </h3>

              {/* Student List */}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                padding: '15px',
                background: 'white',
                marginBottom: '20px'
              }}>
                {attendanceState.semester && semesterData[attendanceState.semester] ? (
                  semesterData[attendanceState.semester].students.map(student => {
                    const initials = student.name.split(' ').map(n => n[0]).join('');
                    const attendanceData = attendanceState.students[student.id];
                    
                    return (
                      <div key={student.id} style={{
                        padding: '15px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3498db, #2c3e50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 600,
                            color: '#2c3e50',
                            fontSize: '1.1rem'
                          }}>
                            {student.name}
                          </div>
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#7f8c8d',
                            fontFamily: "'Courier New', monospace"
                          }}>
                            {student.id}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => markAttendance(student.id, true)}
                            style={{
                              padding: '10px 18px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              background: attendanceData?.present === true ? '#219653' : '#27ae60',
                              color: 'white',
                              transform: attendanceData?.present === true ? 'translateY(-2px)' : 'none',
                              boxShadow: attendanceData?.present === true ? '0 4px 8px rgba(33, 150, 83, 0.3)' : 'none'
                            }}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, false)}
                            style={{
                              padding: '10px 18px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              background: attendanceData?.present === false ? '#c0392b' : '#e74c3c',
                              color: 'white',
                              transform: attendanceData?.present === false ? 'translateY(-2px)' : 'none',
                              boxShadow: attendanceData?.present === false ? '0 4px 8px rgba(192, 57, 43, 0.3)' : 'none'
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
                    Please select a semester to view students
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                textAlign: 'center'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #e9f7fe, #d6eaf8)',
                  padding: '18px',
                  borderRadius: '10px',
                  minWidth: '130px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#3498db'
                  }}>
                    {total}
                  </div>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#7f8c8d',
                    fontWeight: 500
                  }}>
                    Total Students
                  </div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #e9f7fe, #d6eaf8)',
                  padding: '18px',
                  borderRadius: '10px',
                  minWidth: '130px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#3498db'
                  }}>
                    {present}
                  </div>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#7f8c8d',
                    fontWeight: 500
                  }}>
                    Present
                  </div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #e9f7fe, #d6eaf8)',
                  padding: '18px',
                  borderRadius: '10px',
                  minWidth: '130px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#3498db'
                  }}>
                    {absent}
                  </div>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#7f8c8d',
                    fontWeight: 500
                  }}>
                    Absent
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '30px',
            justifyContent: 'center',
            padding: '0 30px 30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => showModal('save')}
              style={{
                padding: '16px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                color: 'white'
              }}
            >
              💾 Save Attendance
            </button>

            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || !isLibraryLoaded}
              style={{
                padding: '16px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: isGeneratingPdf || !isLibraryLoaded ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #27ae60, #219653)',
                color: 'white',
                opacity: isGeneratingPdf || !isLibraryLoaded ? 0.6 : 1
              }}
            >
              {isGeneratingPdf ? '⏳ Generating PDF...' : '📄 Generate PDF'}
            </button>

            <button
              onClick={() => showModal('reset')}
              style={{
                padding: '16px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                color: 'white'
              }}
            >
              🔄 Reset Form
            </button>

            <button
              onClick={() => setShowReports(!showReports)}
              style={{
                padding: '16px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #7f8c8d, #616a6b)',
                color: 'white'
              }}
            >
              📊 {showReports ? 'Hide Reports' : 'View Reports'}
            </button>
          </div>

          {/* Reports Section */}
          {showReports && (
            <div style={{
              background: '#f8f9fa',
              padding: '25px',
              borderRadius: '12px',
              margin: '20px 30px 30px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px'
              }}>
                <h3 style={{
                  color: '#2c3e50',
                  fontSize: '1.4rem',
                  margin: 0
                }}>
                  📊 Attendance Reports
                </h3>
                <button
                  onClick={() => setShowReports(false)}
                  style={{
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Close
                </button>
              </div>

              {reportsData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
                  No attendance records found
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      background: 'white',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)' }}>
                          <th style={{ border: '1px solid #ddd', padding: '15px', color: 'white', fontWeight: 600 }}>Date</th>
                          <th style={{ border: '1px solid #ddd', padding: '15px', color: 'white', fontWeight: 600 }}>Semester</th>
                          <th style={{ border: '1px solid #ddd', padding: '15px', color: 'white', fontWeight: 600 }}>Subject</th>
                          <th style={{ border: '1px solid #ddd', padding: '15px', color: 'white', fontWeight: 600 }}>Present</th>
                          <th style={{ border: '1px solid #ddd', padding: '15px', color: 'white', fontWeight: 600 }}>Absent</th>
                          <th style={{ border: '1px solid #ddd', padding: '15px', color: 'white', fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsData.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE).map((report, index) => (
                          <tr key={report.id} style={{ background: index % 2 === 0 ? '#f2f2f2' : 'white' }}>
                            <td style={{ border: '1px solid #ddd', padding: '15px' }}>{report.date}</td>
                            <td style={{ border: '1px solid #ddd', padding: '15px' }}>Semester {report.semester}</td>
                            <td style={{ border: '1px solid #ddd', padding: '15px' }}>{report.subject}</td>
                            <td style={{ border: '1px solid #ddd', padding: '15px' }}>{report.presentCount}</td>
                            <td style={{ border: '1px solid #ddd', padding: '15px' }}>{report.absentCount}</td>
                            <td style={{ border: '1px solid #ddd', padding: '15px' }}>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => downloadReport(report.id)}
                                  style={{
                                    padding: '8px 15px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #3498db, #2980b9)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  📥 PDF
                                </button>
                                <button
                                  onClick={() => editReport(report.id)}
                                  style={{
                                    padding: '8px 15px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #27ae60, #219653)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setRecordToDelete(report.id);
                                    showModal('delete');
                                  }}
                                  style={{
                                    padding: '8px 15px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {Math.ceil(reportsData.length / REPORTS_PER_PAGE) > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '25px',
                      gap: '10px'
                    }}>
                      {Array.from({ length: Math.ceil(reportsData.length / REPORTS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            padding: '10px 18px',
                            border: '2px solid #3498db',
                            background: page === currentPage ? '#3498db' : 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: page === currentPage ? 'white' : '#3498db'
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {modals.save && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '100%',
              margin: '20px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Save Attendance</h3>
              <p style={{ marginBottom: '25px', color: '#2c3e50' }}>
                Are you sure you want to save this attendance record?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button
                  onClick={() => hideModal('save')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveAttendance}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #27ae60, #219653)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {modals.pdf && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '100%',
              margin: '20px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Generate PDF</h3>
              <p style={{ marginBottom: '25px', color: '#2c3e50' }}>
                Your attendance report PDF is ready. Would you like to download it now?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button
                  onClick={() => hideModal('pdf')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={generatePDF}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #27ae60, #219653)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {modals.success && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '100%',
              margin: '20px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Success</h3>
              <p style={{ marginBottom: '25px', color: '#2c3e50' }}>
                {successMessage}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => hideModal('success')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #27ae60, #219653)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {modals.reset && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '100%',
              margin: '20px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Reset Form</h3>
              <p style={{ marginBottom: '25px', color: '#2c3e50' }}>
                Are you sure you want to reset the form? All unsaved data will be lost.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button
                  onClick={() => hideModal('reset')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={resetForm}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #27ae60, #219653)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {modals.delete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '100%',
              margin: '20px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Delete Record</h3>
              <p style={{ marginBottom: '25px', color: '#2c3e50' }}>
                Are you sure you want to delete this attendance record?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button
                  onClick={() => hideModal('delete')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteReport}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #27ae60, #219653)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}