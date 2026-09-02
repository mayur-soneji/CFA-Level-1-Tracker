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
      const next = Array.from(document.querySelectorAll('.topic'))
        .map((node, index) => ({ node, topicId: topicOrder[index] }))
        .filter(({ node, topicId }) => {
          if (!topicId || node.dataset.curriculumEnhanced === 'true') return false;
          node.dataset.curriculumEnhanced = 'true';
          return true;
        });
      if (next.length) setTargets(current => [...current, ...next]);
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
      <details className="curriculumReadings" key={`${topicId}-${node.dataset.curriculumKey || 'topic'}`}>
        <summary>
          <span className="curriculumSummaryText">
            <span className="curriculumSummaryLabel">CURRICULUM</span>
            <span>{modules.length} readings</span>
          </span>
          <span className="curriculumChevron" aria-hidden="true">⌄</span>
        </summary>
        <ol className="curriculumReadingList">
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
