import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { LanguageStats } from "../lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  languages: LanguageStats[];
}

export default function SkillChart({ languages }: Props) {
  const top = languages.slice(0, 10);
  const otherSize = languages.slice(10).reduce((sum, l) => sum + l.size, 0);

  const labels = top.map((l) => l.name);
  const data = top.map((l) => l.size);
  const colors = top.map((l) => l.color || "#6366f1");

  if (otherSize > 0) {
    labels.push("Other");
    data.push(otherSize);
    colors.push("#475569");
  }

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.map((c) => c + "cc"),
        borderColor: colors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "65%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#e2e8f0",
        bodyColor: "#94a3b8",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return ` ${context.label}: ${percentage}%`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-12" role="img" aria-label={`Language distribution chart: ${top.map(l => `${l.name} ${l.percentage}%`).join(', ')}`}>
      {/* Chart */}
      <div className="w-64 h-64 sm:w-80 sm:h-80">
        <Doughnut data={chartData} options={options} />
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-2 gap-3 w-full">
        {top.map((lang) => (
          <div
            key={lang.name}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-200 truncate">
                {lang.name}
              </div>
              <div className="text-xs text-gray-500">{lang.percentage}%</div>
            </div>
            {/* Mini bar */}
            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(lang.percentage * 2, 100)}%`,
                  backgroundColor: lang.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
