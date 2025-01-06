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

                const email = "fst@example.com";
                const password = "fst";

                // Making a GET request with data in the body
                const response = await axios({
                    method: "get",
                    url: "http://localhost:5000/api/dashboard/student",
                    data: { email, password }, // Send data in the body
                });

                console.log("Tree data fetched successfully:", response.data);
                setTreeData(response.data);
            } catch (error) {
                console.error("Error fetching tree data:", error);
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

    if (!treeData) {
        return <div>No tree data found!</div>;
    }

    return (
        <div>
            <h1>Student Dashboard</h1>
            <h2>{treeData.name}</h2>
            {treeData.ageRanges.map((range) => (
                <div key={range._id}>
                    <h3>Age Range: {range.range}</h3>
                    {range.domains.map((domain) => (
                        <div key={domain._id}>
                            <h4>Domain: {domain.name}</h4>
                            {domain.chapters.map((chapter) => (
                                <p key={chapter._id}>
                                    Chapter: {chapter.name} - {chapter.content}
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default StudentDashboard;
