import React, { useEffect, useMemo, useRef, useState } from 'react';
import './NintendoSelector.css';

const COLUMNS = 4;

const STATUS_COLORS = {
  Active: '#3cd070',
  Beta: '#f7d51d',
  Maintenance: '#f7d51d',
  Planning: '#5fb3ff',
  Archived: '#888'
};

const PlaceholderArt = ({ name }) => {
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h;
  }, [name]);
  const hue = seed % 360;
  const cells = Array.from({ length: 64 }, (_, i) => {
    const on = ((seed >> (i % 31)) ^ (i * 2654435761)) & 1;
    return on;
  });
  return (
    <div
      className="ns-placeholder"
      role="img"
      aria-label={`${name} pixel art`}
      style={{ background: `hsl(${hue}, 60%, 18%)` }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="ns-placeholder-cell"
          style={{ background: c ? `hsl(${(hue + 30) % 360}, 80%, 60%)` : 'transparent' }}
        />
      ))}
    </div>
  );
};

const Tile = ({ project, selected, onSelect, index }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (selected && ref.current && document.activeElement !== ref.current) {
      if (typeof ref.current.scrollIntoView === 'function') {
        ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selected]);

  return (
    <a
      ref={ref}
      className={`ns-tile ${selected ? 'ns-tile-selected' : ''}`}
      data-index={index}
      href={project.root_path}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      aria-label={`Launch ${project.name}`}
      aria-current={selected ? 'true' : undefined}
    >
      <div className="ns-tile-screen">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={`${project.name} screenshot`}
            className="ns-tile-thumb"
          />
        ) : (
          <PlaceholderArt name={project.name} />
        )}
        <div className="ns-tile-scanlines" aria-hidden="true" />
      </div>
      <div className="ns-tile-label">{project.name}</div>
    </a>
  );
};

const DetailPanel = ({ project }) => {
  if (!project) {
    return (
      <div className="ns-detail ns-detail-empty">
        <div className="ns-detail-title">No game selected</div>
      </div>
    );
  }
  const statusColor = STATUS_COLORS[project.status] || '#3cd070';
  return (
    <div className="ns-detail" key={project.name}>
      <div className="ns-detail-screen">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={`${project.name} screenshot`}
            className="ns-detail-thumb"
          />
        ) : (
          <PlaceholderArt name={project.name} />
        )}
        <div className="ns-tile-scanlines" aria-hidden="true" />
      </div>
      <div className="ns-detail-info">
        <div className="ns-detail-title">{project.name}</div>
        <div className="ns-detail-status" style={{ color: statusColor }}>
          <span className="ns-status-dot" style={{ background: statusColor }} />
          {project.status || 'Active'}
        </div>
        {project.description && (
          <div className="ns-detail-description">{project.description}</div>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="ns-tag-row">
            {project.tags.map(tag => (
              <span key={tag} className="ns-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="ns-detail-actions">
          <a
            className="ns-btn ns-btn-primary"
            href={project.root_path}
            data-launch="true"
          >
            ▶ {project.link_label || 'PRESS START'}
          </a>
          {project.docs_path && (
            <a className="ns-btn" href={project.docs_path}>
              ✎ DOCS
            </a>
          )}
          {project.source_url && (
            <a className="ns-btn" href={project.source_url} target="_blank" rel="noreferrer">
              ⌥ SOURCE
            </a>
          )}
        </div>
        {project.qr_code && (
          <div className="ns-qr">
            <img src={project.qr_code} alt={`QR for ${project.name}`} />
            <span>SCAN</span>
          </div>
        )}
      </div>
    </div>
  );
};

const NintendoSelector = ({ projects }) => {
  const [selected, setSelected] = useState(0);
  const containerRef = useRef(null);
  const count = projects.length;

  const move = (delta) => {
    if (count === 0) return;
    setSelected(prev => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= count) return count - 1;
      return next;
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (count === 0) return;
      const isEditable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isEditable) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(COLUMNS);
          break;
        case 'ArrowUp':
          e.preventDefault();
          move(-COLUMNS);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          {
            const project = projects[selected];
            if (project) window.location.href = project.root_path;
          }
          break;
        case 'Home':
          e.preventDefault();
          setSelected(0);
          break;
        case 'End':
          e.preventDefault();
          setSelected(count - 1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [count, selected, projects]);

  const current = projects[selected];

  return (
    <div className="ns-root" ref={containerRef}>
      <div className="ns-marquee">
        <span className="ns-marquee-title">★ TOMMYROAR SYSTEM ★</span>
        <span className="ns-marquee-sub">SELECT GAME — USE ARROWS, PRESS ENTER</span>
      </div>
      <div className="ns-layout">
        <div
          className="ns-grid"
          style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
          role="grid"
          aria-label="Project selector"
        >
          {projects.map((project, i) => (
            <Tile
              key={project.name + i}
              project={project}
              index={i}
              selected={i === selected}
              onSelect={() => setSelected(i)}
            />
          ))}
          {count === 0 && (
            <div className="ns-empty">NO CARTRIDGES INSERTED</div>
          )}
        </div>
        <DetailPanel project={current} />
      </div>
      <div className="ns-footer">
        <span><kbd>◄</kbd> <kbd>►</kbd> <kbd>▲</kbd> <kbd>▼</kbd> MOVE</span>
        <span><kbd>ENTER</kbd> LAUNCH</span>
        <span>{count} GAME{count === 1 ? '' : 'S'}</span>
      </div>
    </div>
  );
};

export default NintendoSelector;
