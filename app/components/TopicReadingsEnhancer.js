'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MODULES = {
  'Quantitative Methods': [
    'Returns of Financial Assets and Instruments',
    'Types of Financial Returns',
    'Benchmarking Returns',
    'The Time Value of Money in Finance',
    'Statistical Characteristics of Asset Returns',
    'Statistical Distributions for Financial Asset Prices and Returns',
    'Estimation and Hypothesis Testing',
    'The Return and Risk of a Financial Portfolio',
    'Simulation of Financial Asset Prices and Returns',
    'Applications of Simple Linear Regression in Finance',
    'Introduction to Financial Data Science'
  ],
  Economics: [
    'The Firm & Market Structures',
    'Understanding Business Cycles',
    'Fiscal Policy',
    'Monetary Policy',
    'Introduction to Geopolitics',
    'International Trade',
    'Capital Flows and the FX Market',
    'Exchange Rate Calculations'
  ],
  'Corporate Finance': [
    'Organizational Forms, Corporate Issuer Features, and Ownership',
    'Investors and Other Stakeholders',
    'Corporate Governance: Conflicts, Mechanisms, Risks, and Benefits',
    'Working Capital and Liquidity',
    'Capital Investments and Capital Allocation',
    'Capital Structure',
    'Business Models'
  ],
  'Financial Statement Analysis': [
    'Introduction to Financial Statement Analysis',
    'Analyzing Income Statements',
    'Analyzing Balance Sheets',
    'Analyzing Statements of Cash Flows I',
    'Analyzing Statements of Cash Flows II',
    'Analysis of Inventories',
    'Analysis of Long-Term Assets',
    'Topics in Long-Term Liabilities and Equity',
    'Analysis of Income Taxes',
    'Financial Reporting Quality',
    'Financial Analysis Techniques',
    'Introduction to Financial Statement Modeling'
  ],
  Equities: [
    'Equity Instrument Features',
    'Equity Jurisdictions, Classes, and the Voting Process',
    'Equity Issuance and Trading',
    'Sources of Equity Returns',
    'Introduction to Equity Valuation',
    'Discounted Cash Flow and Growth Models',
    'Relative Value Equity Valuation Approaches',
    'Financial Statement Forecasting in Equity Valuation',
    'Industry and Competitive Analysis',
    'Company Analysis Past, Present, and Future',
    'Equity Analyst Research Reports',
    'The Capital Asset Pricing Model, Market Model, and Other Factor-Based Equity Models'
  ],
  'Fixed Income': [
    'Fixed Income Instrument Features',
    'Fixed-Income Cash Flows and Types',
    'Fixed Income Issuance and Trading',
    'Fixed-Income Markets for Corporate Issuers',
    'Fixed-Income Markets for Government Issuers',
    'Fixed Income Bond Valuation: Prices and Yields',
    'Yield and Yield Spread Measures for Fixed-Rate Bonds',
    'Yield and Yield Spread Measures for Floating-Rate Instruments',
    'The Term Structure of Interest Rates: Spot, Par, and Forward Curves',
    'Interest Rate Risk and Return',
    'Yield-Based Bond Duration Measures and Properties',
    'Yield-Based Bond Convexity and Portfolio Properties',
    'Curve-Based and Empirical Fixed-Income Risk Measures',
    'Credit Risk',
    'Credit Analysis for Government Issuers',
    'Credit Analysis for Corporate Issuers',
    'Fixed Income Securitization',
    'Asset-Backed Security (ABS) Instrument and Market Features',
    'Mortgage-Backed Security (MBS) Instrument and Market Features'
  ],
  Derivatives: [
    'Derivative Instrument and Derivative Market Features',
    'Forward Commitment and Contingent Claim Features and Instruments',
    'Derivative Benefits, Risks, and Issuer and Investor Uses',
    'Arbitrage, Replication, and the Cost of Carry in Pricing Derivatives',
    'Pricing and Valuation of Futures Contracts',
    'Pricing and Valuation of Interest Rate and Other Swaps',
    'Pricing and Valuation of Options',
    'Option Replication Using Put-Call Parity',
    'Valuing a Derivative Using a One-Period Binomial Model'
  ],
  'Derivatives and Risk Management': [
    'Derivative Instrument and Derivative Market Features',
    'Forward Commitment and Contingent Claim Features and Instruments',
    'Derivative Benefits, Risks, and Issuer and Investor Uses',
    'Arbitrage, Replication, and the Cost of Carry in Pricing Derivatives',
    'Pricing and Valuation of Futures Contracts',
    'Pricing and Valuation of Interest Rate and Other Swaps',
    'Pricing and Valuation of Options',
    'Option Replication Using Put-Call Parity',
    'Valuing a Derivative Using a One-Period Binomial Model'
  ],
  'Alternative Investments': [
    'Alternative Investment Features, Methods, and Structures',
    'Alternative Investment Performance and Returns',
    'Investments in Private Capital: Equity and Debt',
    'Real Estate and Infrastructure',
    'Natural Resources',
    'Hedge Funds',
    'Introduction to Digital Assets'
  ],
  'Portfolio Construction': [
    'Portfolio Risk & Return: Part I',
    'Portfolio Risk & Return: Part II',
    'Portfolio Management: An Overview',
    'Basics of Portfolio Planning & Construction',
    'The Behavioral Biases of Individuals',
    'Introduction to Risk Management'
  ],
  Ethics: [
    'Ethics and Trust in the Investment Profession',
    'Code of Ethics and Standards of Professional Conduct',
    'Guidance for Standard I: Professionalism',
    'Guidance for Standard II: Integrity of Capital Markets',
    'Guidance for Standard III: Duties to Clients',
    'Guidance for Standard IV: Duties to Employers',
    'Guidance for Standard V: Investment Analysis, Recommendations, and Actions',
    'Guidance for Standard VI: Conflicts of Interest',
    'Guidance for Standard VII: Responsibilities as a CFA Institute Member or CFA Candidate',
    'Application of the Code and Standards Level I'
  ],
  'Ethical and Professional Standards': [
    'Ethics and Trust in the Investment Profession',
    'Code of Ethics and Standards of Professional Conduct',
    'Guidance for Standard I: Professionalism',
    'Guidance for Standard II: Integrity of Capital Markets',
    'Guidance for Standard III: Duties to Clients',
    'Guidance for Standard IV: Duties to Employers',
    'Guidance for Standard V: Investment Analysis, Recommendations, and Actions',
    'Guidance for Standard VI: Conflicts of Interest',
    'Guidance for Standard VII: Responsibilities as a CFA Institute Member or CFA Candidate',
    'Application of the Code and Standards Level I'
  ]
};

function ReadingPanel({ title, modules }) {
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
          <span>{modules.length} learning modules</span>
        </span>
        <span className="topicReadingsChevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="topicReadingsBody">
          <div className="topicReadingsHead">
            <span>{title}</span>
            <span>Learning modules</span>
          </div>
          <ol className="topicReadingsList">
            {modules.map((module, index) => (
              <li key={module}>
                <span className="topicReadingNumber">{String(index + 1).padStart(2, '0')}</span>
                <span className="topicReadingTitle">{module}</span>
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
      const nodes = Array.from(document.querySelectorAll('.topicGrid .topic'));
      const next = nodes.map(node => {
        let target = node.querySelector(':scope > .topicReadingsMount');
        if (!target) {
          target = document.createElement('div');
          target.className = 'topicReadingsMount';
          node.appendChild(target);
        }
        const titleNode = node.querySelector('.topicTitle');
        const title = titleNode?.textContent?.trim() || '';
        return { target, title };
      }).filter(item => Array.isArray(MODULES[item.title]));
      setTargets(next);
    };

    findTargets();
    const observer = new MutationObserver(findTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {targets.map(({ target, title }) => (
        createPortal(
          <ReadingPanel key={title} title={title} modules={MODULES[title]} />,
          target
        )
      ))}
    </>
  );
}
