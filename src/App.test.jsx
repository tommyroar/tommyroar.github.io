import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../src/App';
import React from 'react';

test('renders main header', () => {
  render(<App />);
  const headerElements = screen.getAllByText(/tommyroar.github.io/i);
  expect(headerElements.length).toBeGreaterThan(0);
});

test('renders dark mode toggle', () => {
  render(<App />);
  const toggleElement = screen.getByText(/Dark mode/i);
  expect(toggleElement).toBeInTheDocument();
});

test('renders project cards', async () => {
  render(<App />);
  
  // Check for any project card heading (h4 level link in our Card definition)
  const projectLinks = await screen.findAllByRole('link', { name: /Vitamin|intentcity/i });
  expect(projectLinks.length).toBeGreaterThan(0);
  
  // Verify that we have at least one Active badge
  const activeBadges = await screen.findAllByText(/Active/i);
  expect(activeBadges.length).toBeGreaterThanOrEqual(1);

  // Check for presence of primary links (regardless of their label)
  const links = screen.getAllByRole('link', { name: /SPA|App|Link|Documentation/i });
  expect(links.length).toBeGreaterThanOrEqual(1);
});

test('renders thumbnail when present', () => {
  render(<App />);
  // Ensure the page renders without crashing even with mixed data
});

test('renders Documentation link when present', async () => {
  render(<App />);
  const docsLinks = await screen.findAllByText(/Documentation/i);
  expect(docsLinks.length).toBeGreaterThan(0);
});

test('renders QR codes for projects', async () => {
  render(<App />);
  const qrCodes = await screen.findAllByAltText(/QR Code for/i);
  expect(qrCodes.length).toBeGreaterThan(0);
});
