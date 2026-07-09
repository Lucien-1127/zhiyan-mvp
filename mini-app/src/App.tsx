import { TelegramProvider } from './app/providers/TelegramProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { AppRouter } from './app/router/AppRouter';
import './styles/globals.css';
import './styles/telegram-theme.css';
import './styles/tokens.css';

export default function App() {
  return (
    <TelegramProvider>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </TelegramProvider>
  );
}
