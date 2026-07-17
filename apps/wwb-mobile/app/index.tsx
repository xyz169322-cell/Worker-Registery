import { Redirect } from 'expo-router';

export default function Index() {
  // Check auth state here. For now, redirect to login
  return <Redirect href="/(auth)/login" />;
}
