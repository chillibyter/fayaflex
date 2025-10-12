import LeaderboardCard from '../LeaderboardCard'

export default function LeaderboardCardExample() {
  return (
    <div className="space-y-4 max-w-2xl">
      <LeaderboardCard
        rank={1}
        name="Sarah Johnson"
        teamName="Team Alpha"
        calories={32500}
        goalPercentage={108}
      />
      <LeaderboardCard
        rank={2}
        name="Mike Chen"
        teamName="Team Beta"
        calories={31200}
        goalPercentage={104}
      />
      <LeaderboardCard
        rank={3}
        name="Emma Davis"
        teamName="Team Gamma"
        calories={29800}
        goalPercentage={99}
      />
    </div>
  )
}
