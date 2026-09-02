'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { curriculumReadings, readingRanges } from '../lib/curriculumReadings';

const topicOrder = Object.keys(curriculumReadings);

function getModulesForTopic(topicId) {
  const [start] = readingRanges[topicId] || [1];
  return (curriculumReadings[topicId] || []).map((title, index) => ({
    number: start + index,
    title,
  }));
}

export default function CurriculumReadingEnhancer() {
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    const sync = () => {
      const nodes = Array.from(document.querySelectorAll('.topic'));
      const next = nodes
        .map((node, index) => ({ node, topicId: topicOrder[index] }))
        .filter(({ topicId }) => topicId && !nodeHasEnhancer(arguments));
      setTargets(nodes.map((node, index) => ({ node, topicId: topicOrder[index] })).filter(x => x.topicId));
    };

    const observer = new MutationObserver(sync);
    sync();
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <>{targets.map(({ node, topicId }) => {
    const modules = getModulesForTopic(topicId);
    if (!modules.length) return null;
    return createPortal(
      <details className="curriculumReadings" key={topicId}>
        <summary>
          <span className="curriculumSummaryText">
            <span className="curriculumSummaryLabel">CURRICULUM</span>
            <span>{modules.length} readings</span>
          </span>
          <span className="curriculumChevron" aria-hidden="true">⌄</span>
        </summary>
        <ol className="curriculumReadingList" start={modules[0].number}>
          {modules.map(module => (
            <li key={module.number}>
              <span className="readingNumber">Reading {String(module.number).padStart(2, '0')}</span>
              <span className="readingTitle">{module.title}</span>
            </li>
          ))}
        </ol>
      </details>,
      node
    );
  })}</>;
}

function nodeHasEnhancer() {
  return false;
}
