import Hero from './sections/hero/hero';
import FindJobs from './sections/find-jobs/find-jobs';
import UserFeature from './sections/user-feature/user-feature';
import ValueBased from './sections/value-based/value-based';
import AiIntegrations from './sections/ai-integrations/ai-integrations';

export default function Home() {
  return (
    <>
      <Hero />
      <FindJobs />
      <UserFeature />
      <ValueBased />
      <AiIntegrations />
    </>
  );
}
