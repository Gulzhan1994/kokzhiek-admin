import AuthWrapper from '@/components/AuthWrapper';
import { RegistrationKeysPage } from '@/components/keys/RegistrationKeysPage';

export default function KeysPage() {
  return (
    <AuthWrapper>
      <RegistrationKeysPage />
    </AuthWrapper>
  );
}
