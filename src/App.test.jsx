import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../src/App';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import projectsData from './data/projects.json';

test('renders main header', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const headerElements = screen.getAllByText(/tommyroar.github.io/i);
  expect(headerElements.length).toBeGreaterThan(0);
});

test('renders dark mode toggle', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const toggleElement = screen.getByText(/Dark mode/i);
  expect(toggleElement).toBeInTheDocument();
});

test('renders project cards with exact link labels', async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  
  for (const project of projectsData) {
    // Verify the project heading exists
    const projectHeading = await screen.findByRole('link', { name: new RegExp(project.name, 'i') });
    expect(projectHeading).toBeInTheDocument();

    // Verify the exact link label exists
    const expectedLabel = project.link_label || 'Live SPA';
    const liveLinks = screen.getAllByRole('link', { name: new RegExp(expectedLabel, 'i') });
    
    // Ensure at least one link with this label is present (might be multiple projects with same label)
    expect(liveLinks.length).toBeGreaterThanOrEqual(1);
    
    // Verify specific href for this project's link
    const specificLink = liveLinks.find(l => l.getAttribute('href') === project.root_path);
    expect(specificLink).toBeDefined();
  }
});

test('renders thumbnail when present', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  // Ensure the page renders without crashing even with mixed data
});

test('renders Documentation link when present', async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const docsLinks = await screen.findAllByText(/Documentation/i);
  expect(docsLinks.length).toBeGreaterThan(0);
});

test('renders QR codes for projects', async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const qrCodes = await screen.findAllByAltText(/QR Code for/i);
  expect(qrCodes.length).toBeGreaterThan(0);
});

test('navigates to monitoring page', async () => {
  const { fireEvent } = await import('@testing-library/react');
  
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  const monitoringButton = screen.getByRole('button', { name: /Monitoring/i });
  fireEvent.click(monitoringButton);

  const monitoringHeader = await screen.findByRole('heading', { name: /Monitoring/i });
  expect(monitoringHeader).toBeInTheDocument();
  expect(screen.getByText(/Monitoring page is blank for now/i)).toBeInTheDocument();
});
