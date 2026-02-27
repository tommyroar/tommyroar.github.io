import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  Container,
  Box,
  StatusIndicator,
  SpaceBetween,
  Button,
  Alert
} from '@cloudscape-design/components';

const Monitoring = () => {
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authorized', 'denied'
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch from the local Tailscale auth server
        // Use the local hostname or IP when in development
        const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const response = await fetch(`http://${host}:3001/api/whois`);
        const data = await response.json();

        if (data.authorized) {
          setAuthStatus('authorized');
          setUserInfo(data);
        } else {
          setAuthStatus('denied');
          setUserInfo(data);
        }
      } catch (err) {
        setAuthStatus('denied');
        setError('Tailscale identity verification failed. Ensure the auth server is running and you are on the tailnet.');
      }
    };

    checkAuth();
  }, []);

  if (authStatus === 'loading') {
    return (
      <ContentLayout header={<Header variant="h1">Monitoring</Header>}>
        <Container>
          <Box textAlign="center">
            <StatusIndicator type="loading">Verifying Tailscale identity...</StatusIndicator>
          </Box>
        </Container>
      </ContentLayout>
    );
  }

  if (authStatus === 'denied') {
    return (
      <ContentLayout header={<Header variant="h1">Access Denied</Header>}>
        <Container>
          <SpaceBetween size="l">
            <Alert type="error" header="Permission Required">
              {error || `Access restricted to authorized Tailscale users. Current user: ${userInfo?.user || 'Unknown'}`}
            </Alert>
            <Box textAlign="center">
              <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
            </Box>
          </SpaceBetween>
        </Container>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={
        <Header 
          variant="h1"
          description={`Verified as ${userInfo?.user} via ${userInfo?.device}`}
        >
          Monitoring
        </Header>
      }
    >
      <Container>
        <Box textAlign="center" color="inherit">
          <b>Monitoring page is blank for now.</b>
        </Box>
      </Container>
    </ContentLayout>
  );
};

export default Monitoring;
