'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { curriculumReadings, readingRanges } from '../lib/curriculumReadings';

const TOPIC_IDS = {
  'Quantitative Methods': 'quantitativeMethods',
  Economics: 'economics',
  'Corporate Finance': 'corporateFinance',
  'Financial Statement Analysis': 'financialStatementAnalysis',
  Equities: 'equities',
  'Fixed Income': 'fixedIncome',
  'Derivatives and Risk Management': 'derivativesAndRiskManagement',
  Derivatives: 'derivativesAndRiskManagement',
  'Alternative Investments': 'alternativeInvestments',
  'Portfolio Construction': 'portfolioConstruction',
  Ethics: 'ethics',
  'Ethical and Professional Standards': 'ethics',
};

function getReadings(topicId) {
  const [start] = readingRanges[topicId] || [1];
  return (curriculumReadings[topicId] || []).map((title, index) => ({
    number: start + index,
    title,
  }));
}

function ReadingPanel({ title, readings }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="topicReadings">
      <button
        type="button"
        className="topicReadingsToggle"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span className="topicReadingsToggleText">
          <span className="topicReadingsLabel">CURRICULUM</span>
          <span>{readings.length} readings · Reading {String(readings[0]?.number || 0).padStart(2, '0')}–{String(readings[readings.length - 1]?.number || 0).padStart(2, '0')}</span>
        </span>
        <span className="topicReadingsChevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="topicReadingsBody">
          <div className="topicReadingsHead">
            <span>{title}</span>
            <span>2027 curriculum</span>
          </div>
          <ol className="topicReadingsList">
            {readings.map(reading => (
              <li key={reading.number}>
                <span className="topicReadingNumber">Reading {String(reading.number).padStart(2, '0')}</span>
                <span className="topicReadingTitle">{reading.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function TopicReadingsEnhancer() {
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    const findTargets = () => {
      const next = Array.from(document.querySelectorAll('.topicGrid .topic')).map(node => {
        let target = node.querySelector(':scope > .topicReadingsMount');
        if (!target) {
          target = document.createElement('div');
          target.className = 'topicReadingsMount';
          node.appendChild(target);
        }
        const title = node.querySelector('.topicTitle')?.textContent?.trim() || '';
        return { target, title, topicId: TOPIC_IDS[title] };
      }).filter(item => item.topicId);

      setTargets(next);
    };

    findTargets();
    const observer = new MutationObserver(findTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {targets.map(({ target, title, topicId }) => (
        createPortal(
          <ReadingPanel key={`${topicId}-${title}`} title={title} readings={getReadings(topicId)} />,
          target
        )
      ))}
    </>
  );
}
