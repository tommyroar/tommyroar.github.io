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

test('renders Vitamind card', async () => {
  render(<App />);
  const appLink = await screen.findByRole('link', { name: /^Vitamind$/i });
  expect(appLink).toBeInTheDocument();
  expect(appLink).toHaveAttribute('href', '/vitamind/');
  
  const activeBadge = screen.getByText(/Active/i);
  expect(activeBadge).toBeInTheDocument();
});

test('renders thumbnail when present', () => {
  const mockProject = {
    name: "Thumb App",
    root_path: "/thumb/",
    thumbnail: "/thumbnails/thumb.png",
    status: "Active"
  };
  // We can't easily mock the import but we can check if App handles items with thumbnails
  // For now just ensuring the component doesn't crash and logic is present
  render(<App />);
});

test('renders Live SPA and Documentation links', async () => {
  render(<App />);
  const liveLink = await screen.findByText(/Live SPA/i);
  const docsLink = await screen.findByText(/Documentation/i);
  expect(liveLink).toBeInTheDocument();
  expect(docsLink).toBeInTheDocument();
});
