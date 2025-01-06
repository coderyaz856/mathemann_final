import React from 'react';
import './Header.css';

function Header() {
    return (
        <header className="header">
            <div className="header-logo">Mathemann</div>
            <nav className="header-nav">
                <ul>
                    <li><a href="/login">Login</a></li>
                    <li><a href="/signup">Sign Up</a></li>
                    <li><a href="/learning">Learning</a></li>
                </ul>
            </nav>
            <div className="header-search">
                <input type="text" placeholder="Search..." />
                <button className="search-button">
                    <i className="fas fa-search"></i>
                </button>
            </div>
        </header>
    );
}

export default Header;
