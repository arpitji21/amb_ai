import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function VitalsChart({
  data,
  dataKey,
  color,
  domain,
}: {
  data: { t: number; value: number }[];
  dataKey: string;
  color: string;
  domain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data}>
        <YAxis hide domain={domain ?? ['dataMin - 5', 'dataMax + 5']} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} name={dataKey} />
      </LineChart>
    </ResponsiveContainer>
  );
}
