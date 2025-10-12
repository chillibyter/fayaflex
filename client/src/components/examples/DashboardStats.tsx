import DashboardStats from '../DashboardStats'

export default function DashboardStatsExample() {
  return (
    <DashboardStats 
      calories={28500}
      steps={145000}
      workouts={18}
      rank={3}
    />
  )
}
