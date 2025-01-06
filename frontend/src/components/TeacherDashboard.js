import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TeacherDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token'); // Assuming token is stored
                const response = await axios.get('http://localhost:5000/api/dashboard/teacher', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDashboardData(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error fetching teacher dashboard data');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Teacher Dashboard</h1>
            {dashboardData && (
                <>
                    <h2>Main Node: {dashboardData.mainNode}</h2>
                    {dashboardData.ageRanges.map((ageRange) => (
                        <div key={ageRange._id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
                            <h3>Age Range: {ageRange.range}</h3>
                            {ageRange.domains.map((domain) => (
                                <div key={domain._id} style={{ marginLeft: '20px' }}>
                                    <h4>Domain: {domain.name}</h4>
                                    {domain.chapters.map((chapter) => (
                                        <div key={chapter._id} style={{ marginLeft: '40px' }}>
                                            <h5>Chapter: {chapter.name}</h5>
                                            <p>Content: {chapter.content}</p>
                                            <p>
                                                Quizzes: {chapter.quizzes.join(', ')}
                                            </p>
                                            <p>
                                                Images: {chapter.images.join(', ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;
