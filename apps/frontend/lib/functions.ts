export function isPrivateRecruiterRoute(pathname: string) {
  return (
    pathname.startsWith('/recruiter') &&
    !pathname.startsWith('/recruiter/onboarding')
  );
}

export function isPrivateCandidateRoute(pathname: string) {
  return (
    pathname.startsWith('/candidate') &&
    !pathname.startsWith('/candidate/onboarding')
  );
}
