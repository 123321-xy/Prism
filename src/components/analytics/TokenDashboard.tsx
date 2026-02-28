import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAnalyticsStore } from "../../stores/analyticsStore";
import { TrendingUp, DollarSign, Zap, Calendar } from "lucide-react";

export function TokenDashboard() {
  const { dailyUsage, modelBreakdown, getTodayUsage, getWeekTotal } = useAnalyticsStore();
  const today = getTodayUsage();
  const week = getWeekTotal();

  const chartData = dailyUsage.slice(-14).map((d) => ({
    date: d.date.slice(5), // MM-DD
    input: Math.round(d.inputTokens / 1000),
    output: Math.round(d.outputTokens / 1000),
    cost: +d.estimatedCost.toFixed(4),
  }));

  const COLORS = ["var(--color-brand-500)", "#00C6FF", "#7B61FF", "#FF6B6B"];

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
        Token Analytics
      </h1>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginBottom: 28 }}>
        Usage and cost across all projects
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard
          icon={<Zap size={16} />}
          label="Today's Tokens"
          value={today ? fmt(today.inputTokens + today.outputTokens) : "0"}
          sub={today ? `↑${fmt(today.inputTokens)} ↓${fmt(today.outputTokens)}` : "No activity"}
          color="var(--color-brand-500)"
        />
        <StatCard
          icon={<Calendar size={16} />}
          label="7-Day Tokens"
          value={fmt(week.inputTokens + week.outputTokens)}
          sub={`↑${fmt(week.inputTokens)} ↓${fmt(week.outputTokens)}`}
          color="var(--color-info-500)"
        />
        <StatCard
          icon={<DollarSign size={16} />}
          label="Today's Cost"
          value={today ? `$${today.estimatedCost.toFixed(4)}` : "$0"}
          sub="Estimated (Sonnet pricing)"
          color="var(--color-success-500)"
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="7-Day Cost"
          value={`$${week.estimatedCost.toFixed(3)}`}
          sub="Estimated"
          color="var(--color-warning-500)"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
        {/* Line chart */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Daily Token Usage (14 days)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} width={35} unit="K" />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                />
                <Line type="monotone" dataKey="input" stroke="var(--color-brand-500)" strokeWidth={2} dot={false} name="Input (K)" />
                <Line type="monotone" dataKey="output" stroke="#00C6FF" strokeWidth={2} dot={false} name="Output (K)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No data yet — start a conversation" />
          )}
        </div>

        {/* Model pie */}
        {modelBreakdown.length > 0 && (
          <div style={{ ...cardStyle, minWidth: 200 }}>
            <h3 style={cardTitleStyle}>By Model</h3>
            <ResponsiveContainer width={180} height={140}>
              <PieChart>
                <Pie
                  data={modelBreakdown.map((m) => ({ name: m.model, value: m.inputTokens + m.outputTokens }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {modelBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [fmt(v) + " tokens"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {modelBreakdown.map((m, i) => (
                <div key={m.model} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.model.replace("claude-", "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: "var(--bg-elevated)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-subtle)",
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{ color, opacity: 0.85 }}>{icon}</div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{sub}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
      {text}
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  padding: "16px 18px",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 14,
  margin: "0 0 14px",
};
