import { useTheme } from '../contexts/ThemeContext';
import { LiveTab } from './LiveTab';

const LiveScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <LiveTab theme={theme} headerVariant="page" />
  );
};

export default LiveScreen;
