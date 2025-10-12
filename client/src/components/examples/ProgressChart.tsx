import ProgressChart from '../ProgressChart'

export default function ProgressChartExample() {
  const mockData = [
    { date: "Week 1", calories: 7200 },
    { date: "Week 2", calories: 8500 },
    { date: "Week 3", calories: 7800 },
    { date: "Week 4", calories: 9200 },
  ];

  return (
    <div className="max-w-4xl">
      <ProgressChart data={mockData} />
    </div>
  )
}
