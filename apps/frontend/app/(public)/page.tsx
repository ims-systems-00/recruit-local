import Hero from './sections/hero/hero';
import FindJobs from './sections/find-jobs/find-jobs';
import UserFeature from './sections/user-feature/user-feature';
import ValueBased from './sections/value-based/value-based';
import AiIntegrations from './sections/ai-integrations/ai-integrations';
import KeyAspects from './sections/key-aspects/key-aspects';
import RecruitmentTeam from './sections/recruitment-team/recruitment-team';

export default function Home() {
  return (
    <>
      <Hero />
      <FindJobs />
      <UserFeature />
      <ValueBased />
      <AiIntegrations />
      <KeyAspects />
      <RecruitmentTeam />
    </>
  );
}
