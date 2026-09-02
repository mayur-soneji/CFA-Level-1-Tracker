import './globals.css';
import './components.css';
import DataTransfer from './components/DataTransfer';
import DynamicDateController from './components/DynamicDateController';
import MockEmptyStateEnhancer from './components/MockEmptyStateEnhancer';

export const metadata = { title: 'CFA Level I Tracker', description: 'CFA Level I August 2027 study tracker' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<MockEmptyStateEnhancer /><DynamicDateController /><DataTransfer /></body></html>;
}
