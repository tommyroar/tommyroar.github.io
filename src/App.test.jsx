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

test('renders Vitamind SPA card', async () => {
  render(<App />);
  const appLink = await screen.findByText(/Vitamind SPA/i);
  expect(appLink).toBeInTheDocument();
  expect(appLink.closest('a')).toHaveAttribute('href', '/maps/vitamind/');
});

test('renders Live SPA and Documentation links', async () => {
  render(<App />);
  const liveLink = await screen.findByText(/Live SPA/i);
  const docsLink = await screen.findByText(/Documentation/i);
  expect(liveLink).toBeInTheDocument();
  expect(docsLink).toBeInTheDocument();
});
