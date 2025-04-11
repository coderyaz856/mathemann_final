import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import './TeacherDashboard.css';

// Import teacher components
import TeacherInbox from './Teacher/TeacherInbox';
import TeacherNotifications from './Teacher/TeacherNotifications';
import TeacherStats from './Teacher/TeacherStats';
import TeacherStudents from './Teacher/TeacherStudents';
import TeacherOverview from './Teacher/TeacherOverview';

// Import icons
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaChartBar,
  FaEnvelope,
  FaBell,
  FaSignOutAlt,
  FaClipboardCheck,
  FaBook,
  FaQuestionCircle,
  FaLightbulb,
  FaTachometerAlt
} from 'react-icons/fa';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [teacherData, setTeacherData] = useState(null);
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeStudents: 0, 
    averageProgress: 0,
    averageScore: 0,
    recentActivity: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          navigate('/login');
          return;
        }

        // Fetch teacher profile
        const profileResponse = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setTeacherData(profileResponse.data);

        // Fetch students data
        const studentsResponse = await axios.get('http://localhost:5000/api/users/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(studentsResponse.data);
        
        // Fetch messages
        const messagesResponse = await axios.get('http://localhost:5000/api/messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const messagesData = messagesResponse.data || [];
        setMessages(messagesData);
        setUnreadMessages(messagesData.filter(message => !message.isRead).length);
        
        // Fetch notifications
        const notificationsResponse = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const notificationsData = notificationsResponse.data || [];
        setNotifications(notificationsData);
        setUnreadNotifications(notificationsData.filter(notification => !notification.isRead).length);
        
        // Calculate dashboard stats
        const totalStudents = studentsResponse.data.length;
        const activeStudents = studentsResponse.data.filter(student => 
          student.lastActivity && new Date(student.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;
        
        const studentProgress = studentsResponse.data.map(student => student.progress?.completedChapters / student.progress?.totalChapters || 0);
        const averageProgress = studentProgress.length ? 
          Math.round((studentProgress.reduce((a, b) => a + b, 0) / studentProgress.length) * 100) : 0;
        
        const studentScores = studentsResponse.data.map(student => student.quizAvgScore || 0);
        const averageScore = studentScores.length ? 
          Math.round(studentScores.reduce((a, b) => a + b, 0) / studentScores.length) : 0;
          
        const recentActivity = [...messagesData.slice(0, 3), ...notificationsData.slice(0, 3)]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
          
        setDashboardStats({
          totalStudents,
          activeStudents,
          averageProgress,
          averageScore,
          recentActivity
        });

      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [activeTab, navigate]);

  const handleReadMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      
      setUnreadMessages(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  const handleReadNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const sendEmail = async (recipient, subject, body) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/messages', {
        recipient,
        subject,
        body
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <TeacherOverview 
            teacherData={teacherData} 
            stats={dashboardStats} 
            students={students}
            unreadMessages={unreadMessages}
            unreadNotifications={unreadNotifications}
          />
        );
      case 'students':
        return (
          <TeacherStudents 
            students={students} 
            sendEmail={sendEmail}
          />
        );
      case 'notifications':
        return (
          <TeacherNotifications 
            notifications={notifications}
            onRead={handleReadNotification}
          />
        );
      case 'inbox':
        return (
          <TeacherInbox 
            messages={messages}
            onRead={handleReadMessage}
            sendEmail={sendEmail}
          />
        );
      case 'stats':
        return <TeacherStats students={students} />;
      default:
        return <TeacherOverview teacherData={teacherData} stats={dashboardStats} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="teacher-profile-summary">
          {teacherData && (
            <>
              <div className="teacher-avatar">
                {teacherData.name ? teacherData.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="teacher-info">
                <h3>{teacherData.name || 'Teacher'}</h3>
                <p>{teacherData.subject || 'Mathematics'}</p>
              </div>
            </>
          )}
        </div>
        
        <button
          className={`sidebar-tab ${activeTab === 'overview' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaTachometerAlt className="tab-icon" />
          <span>Dashboard</span>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'students' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <FaUserGraduate className="tab-icon" />
          <span>Students</span>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'notifications' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FaBell className="tab-icon" />
          <span>Notifications</span>
          {unreadNotifications > 0 && <span className="badge">{unreadNotifications}</span>}
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'inbox' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <FaEnvelope className="tab-icon" />
          <span>Inbox</span>
          {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'stats' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <FaChartBar className="tab-icon" />
          <span>Stats</span>
        </button>
        
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
          >
            <FaSignOutAlt className="logout-icon" /> Sign Out
          </button>
        </div>
      </div>
      
      <div className="dashboard-main">
        {error ? <div className="error-message">{error}</div> : renderContent()}
      </div>
    </div>
  );
};

export default TeacherDashboard;
