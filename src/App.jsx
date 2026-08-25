import AppClean from './AppClean';

function App() {
  const publicClubId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('club')
    : null;

  return <AppClean initialPublicClubId={publicClubId} />;
}

export default App;
