import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/store';

export default function Index() {
  const status = useAuth((state) => state.status);
  return <Redirect href={status === 'signedIn' ? '/trail' : '/login'} />;
}
