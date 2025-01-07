import React, { useEffect, useState } from "react";
import axios from "axios";

const StudentDashboard = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching tree data from API...");

                const email = localStorage.getItem("email");
                const password = localStorage.getItem("password");

                if (!email || !password) {
                    setError("User credentials are missing.");
                    setLoading(false);
                    return;
                }

                // Fetch tree data from the API
                const response = await axios.get("http://localhost:5000/api/dashboard/student", {
                    params: { email, password },
                });

                console.log("Tree data fetched successfully:", JSON.stringify(response.data, null, 2));
                setTreeData(response.data);
            } catch (error) {
                console.error("Error fetching tree data:", error.response?.data || error.message);
                setError("Failed to fetch tree data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!treeData || !treeData.domains || treeData.domains.length === 0) {
        return <div>No tree data found!</div>;
    }

    return (
        <div>
            <h1>Student Dashboard</h1>
            <h2>Tree Name: {treeData.name || "Tree Name Unavailable"}</h2>
            <h3>Age Range: {treeData.range || "Unknown Range"}</h3>
            {treeData.domains.map((domain) => (
                <div key={domain._id}>
                    <h4>Domain: {domain.name || "Unnamed Domain"}</h4>
                    {domain.chapters && domain.chapters.length > 0 ? (
                        domain.chapters.map((chapter) => (
                            <div key={chapter._id}>
                                <p>
                                    <strong>Chapter:</strong> {chapter.name || "Unnamed Chapter"}
                                </p>
                                <p>
                                    <strong>Content:</strong> {chapter.content || "No Content"}
                                </p>
                                {chapter.quizzes && chapter.quizzes.length > 0 && (
                                    <p>
                                        <strong>Quizzes:</strong> {chapter.quizzes.join(", ")}
                                    </p>
                                )}
                                {chapter.images && chapter.images.length > 0 && (
                                    <p>
                                        <strong>Images:</strong>{" "}
                                        {chapter.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`Chapter ${chapter.name} Image ${idx + 1}`}
                                                style={{ maxWidth: "100px", margin: "5px" }}
                                            />
                                        ))}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No chapters available for this domain.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StudentDashboard;
