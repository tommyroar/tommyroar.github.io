import React from 'react';
import {
  ContentLayout,
  Header,
  Container,
  Box
} from '@cloudscape-design/components';

const Monitoring = () => {
  return (
    <ContentLayout
      header={
        <Header variant="h1">Monitoring</Header>
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
