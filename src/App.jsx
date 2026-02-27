import React, { useState, useEffect } from 'react';
import {
  AppLayout,
  Container,
  Header,
  ContentLayout,
  Cards,
  Link,
  Box,
  SpaceBetween,
  TopNavigation,
  Badge,
  Toggle
} from '@cloudscape-design/components';
import { applyMode, Mode } from '@cloudscape-design/global-styles';
import ReactMarkdown from 'react-markdown';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import projectsData from './data/projects.json';
import Monitoring from './Monitoring';

const Home = ({ projects, isDarkMode, setIsDarkMode }) => (
  <ContentLayout
    header={
      <Header
        variant="h1"
        description="A central hub for specialized tools and geographic visualizations."
      >
        tommyroar.github.io
      </Header>
    }
  >
    <Cards
      cardDefinition={{
        header: item => (
          <Link href={item.root_path} variant="awsui-h4-main">
            {item.name}
          </Link>
        ),
        sections: [
          {
            id: "thumbnail",
            content: item => item.thumbnail && (
              <Box margin={{ bottom: "m" }}>
                <img 
                  src={item.thumbnail} 
                  alt={item.name} 
                  style={{ width: '50%', height: 'auto', borderRadius: '4px', border: '1px solid #eaeded' }} 
                />
              </Box>
            )
          },
          {
            id: "description",
            header: "Description",
            content: item => (
              <div className="markdown-body">
                <ReactMarkdown>{item.description}</ReactMarkdown>
              </div>
            )
          },
          {
            id: "links",
            header: "Links",
            content: item => (
              <SpaceBetween direction="horizontal" size="l" alignItems="center">
                <SpaceBetween direction="horizontal" size="m">
                  <Link href={item.root_path} external>{item.link_label || 'Live SPA'}</Link>
                  {item.docs_path && <Link href={item.docs_path} external>Documentation</Link>}
                </SpaceBetween>
                {item.qr_code && (
                  <img 
                    src={item.qr_code} 
                    alt={`QR Code for ${item.name}`} 
                    style={{ width: '64px', height: '64px', border: '1px solid #eaeded', padding: '2px', background: 'white' }} 
                  />
                )}
              </SpaceBetween>
            )
          },
          {
            id: "status",
            header: "Status",
            content: item => (
              <SpaceBetween direction="horizontal" size="s">
                <Badge color={item.status === 'Active' ? 'green' : 'blue'}>{item.status}</Badge>
                {item.tags && item.tags.map(tag => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </SpaceBetween>
            )
          }
        ]
      }}
      items={projects}
      loadingText="Loading projects"
      empty={
        <Box textAlign="center" color="inherit">
          <b>No projects found</b>
        </Box>
      }
    />
  </ContentLayout>
);

const App = () => {
  const [projects, setProjects] = useState(projectsData);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      applyMode(Mode.Dark);
      document.documentElement.classList.add('awsui-dark-mode');
    } else {
      applyMode(Mode.Light);
      document.documentElement.classList.remove('awsui-dark-mode');
    }
  }, [isDarkMode]);

  return (
    <div id="h" className={isDarkMode ? "awsui-dark-mode" : ""} style={{ position: 'relative' }}>
      <TopNavigation
        key={isDarkMode ? "dark" : "light"}
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
            <Route path="/" element={<Home projects={projects} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Routes>
        }
      />
    </div>
  );
};

export default App;
