import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import Config from '../config';

const PerGameLineChart = ({ data, width, height }) => {
  if (data && data.length > 0) {
    const p1 = data[0].p1;
    const p2 = data[0].p2;
    return (
      <LineChart width={width} height={height} data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="gameNum" />
        <YAxis domain={['dataMin', 'dataMax']} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={ p1 } stroke={Config.h2hColors[0]} />
        <Line type="monotone" dataKey={ p2 } stroke={Config.h2hColors[1]} />
      </LineChart>
    );
  }
};

export default PerGameLineChart;