import React from 'react';
import './StudentStats.css';
import { FaTrophy, FaChartLine } from 'react-icons/fa';

const StudentStats = ({ stats, studies, quizAttempts }) => {
    const formatDate = (date) => new Date(date).toLocaleDateString();

    return (
        <div className="stats-container">
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Study Sessions</h3>
                    <div className="stat-value">{stats.totalSessions}</div>
                    <div className="stat-detail">Total sessions</div>
                </div>
                <div className="stat-card">
                    <h3>Unique Chapters</h3>
                    <div className="stat-value">{stats.uniqueChapters}</div>
                    <div className="stat-detail">Different topics covered</div>
                </div>
                <div className="stat-card">
                    <h3>Active Streak</h3>
                    <div className="stat-value">{stats.activeStreak} days</div>
                    <div className="stat-detail">Keep it up!</div>
                </div>
                <div className="stat-card">
                    <h3>Monthly Activity</h3>
                    <div className="stat-value">{stats.studyHoursThisMonth}</div>
                    <div className="stat-detail">Sessions this month</div>
                </div>
                
                {/* Quiz stats */}
                <div className="stat-card">
                    <h3>Quiz Performance</h3>
                    <div className="stat-value">
                        {stats.quizAvgScore ? `${stats.quizAvgScore}%` : 'No data'}
                    </div>
                    <div className="stat-detail">Average score</div>
                </div>
                <div className="stat-card">
                    <h3>Quizzes Taken</h3>
                    <div className="stat-value">{stats.quizAttempts || 0}</div>
                    <div className="stat-detail">Total attempts</div>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                    {studies?.slice(-3).reverse().map((study, index) => (
                        <div key={`study-${index}`} className="activity-item">
                            <span className="activity-chapter">{study.chapter.name}</span>
                            <span className="activity-date">{formatDate(study.session_start)}</span>
                        </div>
                    ))}
                    
                    {/* Quiz attempts */}
                    {quizAttempts?.slice(-2).reverse().map((attempt, index) => (
                        <div key={`quiz-${index}`} className="activity-item quiz-activity">
                            <span className="activity-quiz">
                                <FaTrophy className={attempt.score >= 70 ? "high-score" : "normal-score"} /> 
                                Quiz: {attempt.quiz.title || "Practice Quiz"}
                            </span>
                            <span className="activity-score">{attempt.score}% ({attempt.correct}/{attempt.total})</span>
                            <span className="activity-date">{formatDate(attempt.date)}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Quiz performance chart */}
            {quizAttempts?.length > 0 && (
                <div className="quiz-performance-chart">
                    <h3><FaChartLine /> Quiz Performance Trend</h3>
                    <div className="quiz-chart">
                        <div className="score-bars">
                            {quizAttempts.slice(-5).map((attempt, index) => (
                                <div 
                                    key={index} 
                                    className="score-bar"
                                    style={{ height: `${attempt.score}%` }}
                                    title={`${attempt.quiz.title}: ${attempt.score}%`}
                                >
                                    <span className="score-value">{attempt.score}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentStats;
