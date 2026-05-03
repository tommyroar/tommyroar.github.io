import React, { useState, useEffect } from 'react';
import {
  AppLayout,
  TopNavigation
} from '@cloudscape-design/components';
import { applyMode, Mode } from '@cloudscape-design/global-styles';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import projectsData from './data/projects.json';
import Monitoring from './Monitoring';
import NintendoSelector from './NintendoSelector';

const Home = ({ projects }) => (
  <NintendoSelector projects={projects} />
);

const App = () => {
  const [projects, setProjects] = useState(projectsData);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const theme = isDarkMode ? Mode.Dark : Mode.Light;
    applyMode(theme);
    
    // Enable visual refresh globally
    document.documentElement.classList.add('awsui-visual-refresh');
    document.body.classList.add('awsui-visual-refresh');
    
    if (isDarkMode) {
      document.documentElement.classList.remove('awsui-light-mode');
      document.documentElement.classList.add('awsui-dark-mode');
      document.documentElement.setAttribute('data-awsui-color-mode', 'dark');
      document.body.classList.remove('awsui-light-mode');
      document.body.classList.add('awsui-dark-mode');
      document.body.setAttribute('data-awsui-color-mode', 'dark');
    } else {
      document.documentElement.classList.remove('awsui-dark-mode');
      document.documentElement.classList.add('awsui-light-mode');
      document.documentElement.setAttribute('data-awsui-color-mode', 'light');
      document.body.classList.remove('awsui-dark-mode');
      document.body.classList.add('awsui-light-mode');
      document.body.setAttribute('data-awsui-color-mode', 'light');
    }
  }, [isDarkMode]);

  return (
    <div id="h" className={isDarkMode ? "awsui-dark-mode" : "awsui-light-mode"} style={{ position: 'relative' }}>
      <style>
        {`
          .awsui-context-top-navigation header {
            background-color: ${isDarkMode ? '#161d26' : '#ffffff'} !important;
          }
          .awsui-context-top-navigation [class*="title"], 
          .awsui-context-top-navigation [class*="identity"],
          .awsui-context-top-navigation [class*="utility"],
          .awsui-context-top-navigation a,
          .awsui-context-top-navigation span {
            color: ${isDarkMode ? '#ffffff' : '#0f141a'} !important;
          }
        `}
      </style>
      <TopNavigation
        identity={{
          href: "#/",
          title: "tommyroar.github.io",
          onFollow: (e) => {
            e.preventDefault();
            navigate('/');
          }
        }}
        utilities={[
          {
            type: "button",
            text: "Monitoring",
            onClick: () => navigate('/monitoring')
          },
          {
            type: "button",
            ariaLabel: "Toggle dark mode",
            text: isDarkMode ? "🌙" : "🌞",
            onClick: () => setIsDarkMode(!isDarkMode),
          }
        ]}
      />
      <AppLayout
        navigationHide={true}
        toolsHide={true}
        content={
          <Routes>
            <Route path="/" element={<Home projects={projects} />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Routes>
        }
      />
    </div>
  );
};

export default App;
