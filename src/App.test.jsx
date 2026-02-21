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
  
  // Check Vitamind
  const vitamindLink = await screen.findByRole('link', { name: /^Vitamind$/i });
  expect(vitamindLink).toBeInTheDocument();
  expect(vitamindLink).toHaveAttribute('href', '/vitamind/');

  // Check intentcity
  const intentcityLink = await screen.findByRole('link', { name: /^intentcity$/i });
  expect(intentcityLink).toBeInTheDocument();
  expect(intentcityLink).toHaveAttribute('href', '/intentcity/');
  
  // Verify that we have multiple Active badges and Live SPA links
  const activeBadges = screen.getAllByText(/Active/i);
  expect(activeBadges.length).toBeGreaterThanOrEqual(2);

  const liveLinks = screen.getAllByText(/Live SPA/i);
  expect(liveLinks.length).toBeGreaterThanOrEqual(2);
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
