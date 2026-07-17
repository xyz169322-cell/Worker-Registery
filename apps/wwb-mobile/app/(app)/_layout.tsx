import { Stack } from 'expo-router';
import { I18nProvider } from '../../lib/i18n';
import { WorkerProvider } from '../../lib/WorkerContext';

export default function AppLayout() {
  return (
    <I18nProvider>
      <WorkerProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="verification" />
          <Stack.Screen name="documents" />
        </Stack>
      </WorkerProvider>
    </I18nProvider>
  );
}
