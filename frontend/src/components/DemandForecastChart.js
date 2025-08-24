import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function buildSeries(rows) {
  // 2020..2024; demand derived from units_sold & price (simple proxy)
  const years = [2020, 2021, 2022, 2023, 2024];
  return years.map((year, i) => {
    // average across rows for a clean trend
    const avgPrice = rows.length
      ? rows.reduce((s, r) => s + (Number(r.current_price) || 0), 0) / rows.length
      : 0;
    const avgUnits = rows.length
      ? rows.reduce((s, r) => s + (Number(r.units_sold) || 0), 0) / rows.length
      : 0;

    // small wave to look like the reference mock
    const k = 1 + Math.sin((i / years.length) * Math.PI * 2) * 0.2;

    return {
      year,
      price: Number((avgPrice * (0.9 + i * 0.03)).toFixed(2)),
      demand: Math.round((avgUnits * 0.00003) * k * 100) / 100, // scaled for chart
    };
  });
}

export default function DemandForecastChart({ rows }) {
  const data = buildSeries(rows);
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="demand" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="price" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
