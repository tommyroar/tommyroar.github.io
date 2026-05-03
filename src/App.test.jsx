import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { expect, test, beforeEach } from 'vitest';
import App from '../src/App';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import projectsData from './data/projects.json';

beforeEach(() => {
  cleanup();
  document.body.className = '';
  document.documentElement.className = '';
});

const renderApp = () =>
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

test('renders TopNavigation header', () => {
  renderApp();
  const headerElements = screen.getAllByText(/tommyroar.github.io/i);
  expect(headerElements.length).toBeGreaterThan(0);
});

test('renders the marquee title', () => {
  renderApp();
  expect(screen.getByText(/TOMMYROAR SYSTEM/i)).toBeInTheDocument();
  expect(screen.getByText(/SELECT GAME/i)).toBeInTheDocument();
});

test('renders dark mode toggle', () => {
  renderApp();
  const toggleButton = screen.getByRole('button', { name: /Toggle dark mode/i });
  expect(toggleButton).toBeInTheDocument();
});

test('renders a tile for every project with correct href', () => {
  renderApp();
  for (const project of projectsData) {
    const tile = screen.getByRole('link', { name: new RegExp(`Launch ${project.name}`, 'i') });
    expect(tile).toBeInTheDocument();
    expect(tile.getAttribute('href')).toBe(project.root_path);
  }
});

test('first tile is selected by default and shows detail panel', () => {
  renderApp();
  const sorted = [...projectsData].sort((a, b) => a.name.localeCompare(b.name));
  const first = sorted[0];
  const tiles = screen.getAllByRole('link', { name: /^Launch / });
  expect(tiles[0].getAttribute('aria-current')).toBe('true');
  expect(screen.getAllByText(new RegExp(first.name, 'i')).length).toBeGreaterThan(0);
});

test('arrow right moves selection to next tile', async () => {
  renderApp();
  const tiles = screen.getAllByRole('link', { name: /^Launch / });
  expect(tiles[0].getAttribute('aria-current')).toBe('true');

  await act(async () => {
    fireEvent.keyDown(window, { key: 'ArrowRight' });
  });

  const updated = screen.getAllByRole('link', { name: /^Launch / });
  if (updated.length > 1) {
    expect(updated[1].getAttribute('aria-current')).toBe('true');
    expect(updated[0].getAttribute('aria-current')).toBeNull();
  }
});

test('arrow left at start stays on first tile', async () => {
  renderApp();
  await act(async () => {
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
  });
  const tiles = screen.getAllByRole('link', { name: /^Launch / });
  expect(tiles[0].getAttribute('aria-current')).toBe('true');
});

test('renders DOCS link in detail panel for selected project with docs_path', () => {
  renderApp();
  const docsLinks = screen.getAllByRole('link', { name: /DOCS/i });
  expect(docsLinks.length).toBeGreaterThan(0);
});

test('renders QR code in detail panel when present', () => {
  renderApp();
  const qrCodes = screen.getAllByAltText(/^QR for /i);
  expect(qrCodes.length).toBeGreaterThan(0);
});

test('renders pixelated screenshot for projects with thumbnails', () => {
  renderApp();
  const screenshots = screen.getAllByAltText(/screenshot/i);
  expect(screenshots.length).toBeGreaterThan(0);
});

test('renders footer with key hints and game count', () => {
  renderApp();
  expect(screen.getByText(/MOVE/i)).toBeInTheDocument();
  const launchHints = screen.getAllByText(/LAUNCH/i);
  expect(launchHints.length).toBeGreaterThan(0);
  expect(screen.getByText(new RegExp(`^${projectsData.length} GAMES?$`))).toBeInTheDocument();
});

test('navigates to monitoring page', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  const monitoringButton = screen.getByRole('button', { name: /Monitoring/i });
  fireEvent.click(monitoringButton);

  const monitoringHeader = await screen.findByRole('heading', { name: /Monitoring/i });
  expect(monitoringHeader).toBeInTheDocument();
});

test('toggles dark mode', async () => {
  renderApp();
  const getToggleButton = () => screen.getByRole('button', { name: /Toggle dark mode/i });

  expect(screen.getAllByText('🌙').length).toBeGreaterThan(0);

  await act(async () => {
    fireEvent.click(getToggleButton());
  });
  expect(screen.getAllByText('🌞').length).toBeGreaterThan(0);

  await act(async () => {
    fireEvent.click(getToggleButton());
  });
  expect(screen.getAllByText('🌙').length).toBeGreaterThan(0);
});
