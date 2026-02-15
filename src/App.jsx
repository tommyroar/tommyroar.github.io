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
  Badge
} from '@cloudscape-design/components';

import projectsData from './data/projects.json';

const App = () => {
  const [projects, setProjects] = useState(projectsData);

  useEffect(() => {
    // Projects are now bundled at build time via bundle_apps.js
  }, []);

  return (
    <div id="h" style={{ position: 'relative' }}>
      <TopNavigation
        identity={{
          href: "#",
          title: "Tommy's Portfolio",
        }}
        utilities={[]}
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
              >
                Welcome to Tommy's Projects
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
                    content: item => <Box variant="p">{item.description}</Box>
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
                      <Badge color={item.status === 'Active' ? 'green' : 'blue'}>{item.status}</Badge>
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
            
            <Box margin={{ top: "l" }}>
               <Container
                header={
                  <Header variant="h2">Maps Overview</Header>
                }
              >
                <SpaceBetween size="s">
                  <Box variant="p">A collection of geographic and spatial visualization tools.</Box>
                  <Link href="/maps/">View Maps Section</Link>
                </SpaceBetween>
              </Container>
            </Box>
          </ContentLayout>
        }
      />
    </div>
  );
};

export default App;
