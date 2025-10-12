import TeamCard from '../TeamCard'

export default function TeamCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      <TeamCard
        name="Team Alpha"
        memberCount={12}
        totalCalories={385000}
        rank={1}
        isOwner={true}
        onInvite={() => console.log('Invite clicked')}
      />
      <TeamCard
        name="Team Beta"
        memberCount={15}
        totalCalories={362000}
        rank={2}
      />
      <TeamCard
        name="Team Gamma"
        memberCount={10}
        totalCalories={341000}
        rank={3}
      />
    </div>
  )
}
