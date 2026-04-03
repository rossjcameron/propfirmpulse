import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../src/constants/theme';
import { AppProvider } from '../src/context/AppContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              color: theme.colors.text,
              fontSize: 17,
              fontWeight: '700',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="trade/[id]"
            options={{
              title: 'Trade Entry',
              headerBackTitle: 'Back',
              headerBackButtonDisplayMode: 'default',
            }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}