import './globals.css';
import './components.css';
import './ui-cleanup.css';
import './curriculum-readings.css';
import './readiness-fix.css';
import './sticky-nav-fix.css';
import './footer-cleanup.css';
import './study-log-reading-dialog.css';
import DataTransfer from './components/DataTransfer';
import DynamicDateController from './components/DynamicDateController';
import MockEmptyStateEnhancer from './components/MockEmptyStateEnhancer';
import TopicReadingsEnhancer from './components/TopicReadingsEnhancer';
import StudyLogReadingDialog from './components/StudyLogReadingDialog';

export const metadata = { title: 'CFA Level I Tracker', description: 'CFA Level I August 2027 study tracker' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<MockEmptyStateEnhancer /><TopicReadingsEnhancer /><StudyLogReadingDialog /><DynamicDateController /><DataTransfer /></body></html>;
}
