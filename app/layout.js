import './tailwind.css';
import './globals.css';
import './components.css';
import DataTransfer from './components/DataTransfer';
import DynamicDateController from './components/DynamicDateController';
import MockProgressCTA from './components/MockProgressCTA';

export const metadata = { title: 'CFA Level I Tracker', description: 'CFA Level I August 2027 study tracker' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<MockProgressCTA /><DynamicDateController /><DataTransfer /></body></html>;
}
