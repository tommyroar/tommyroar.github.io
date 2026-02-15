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
import projectsData from './data/projects.json';

const App = () => {
  const [projects, setProjects] = useState(projectsData);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      applyMode(Mode.Dark);
    } else {
      applyMode(Mode.Light);
    }
  }, [isDarkMode]);

  return (
    <div id="h" style={{ position: 'relative' }}>
      <TopNavigation
        identity={{
          href: "#",
          title: "tommyroar.github.io",
        }}
        utilities={[
          {
            type: "menu-dropdown",
            text: "Settings",
            iconName: "settings",
            items: [
              {
                id: "theme",
                text: "Dark mode",
                itemType: "section",
                items: [
                  {
                    id: "dark-mode-toggle",
                    text: isDarkMode ? "Enabled" : "Disabled",
                  }
                ]
              }
            ]
          },
          {
            type: "button",
            text: isDarkMode ? "Light Mode" : "Dark Mode",
            onClick: () => setIsDarkMode(!isDarkMode)
          }
        ]}
      />
      <AppLayout
        navigationHide={true}
        toolsHide={true}
        content={
          <ContentLayout
            header={
              <Header
                variant="h1"
                description="A central hub for specialized tools and geographic visualizations."
                actions={
                  <Toggle
                    onChange={({ detail }) => setIsDarkMode(detail.checked)}
                    checked={isDarkMode}
                  >
                    Dark mode
                  </Toggle>
                }
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
                      <SpaceBetween direction="horizontal" size="m">
                        <Link href={item.root_path} external>Live SPA</Link>
                        {item.docs_path && <Link href={item.docs_path} external>Documentation</Link>}
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
        }
      />
    </div>
  );
};

export default App;
