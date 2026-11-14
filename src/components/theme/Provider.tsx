'use client';
import { ThemeProvider, useTheme } from 'next-themes';
import { NimiThemeProvider } from '@nimiplatform/kit/ui';

function KitTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <NimiThemeProvider
      scheme={resolvedTheme === 'light' ? 'light' : 'dark'}
      accentPack="nimi-accent"
    >
      {children}
    </NimiThemeProvider>
  );
}

const ThemeProviderComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <KitTheme>{children}</KitTheme>
    </ThemeProvider>
  );
};

export default ThemeProviderComponent;
