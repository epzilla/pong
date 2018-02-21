import { PieChart, Pie, ResponsiveContainer, Sector, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#00C49F'];
const RADIAN = Math.PI / 180;

const renderLabel = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, label, percent, value, index } = props;
  //   console.log(props);
  // const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  // const x  = cx + radius * Math.cos(-midAngle * RADIAN);
  // const y = cy  + radius * Math.sin(-midAngle * RADIAN);
  if (label === 'Draws') {
    return;
  }

  let labelFontSize = label.length > 10 ? (label.length > 15 ? 12 : 16) : 20;
  let numberFontSize = value > 999 ? 14 : 20;
  let numberOffset = value > 999 ? 22 : 18;

  if (index === 0) {
    return (
      <g>
        <text x={cx - 90} y={cy - 75} fill={fill} textAnchor={'middle'} font-size={`${labelFontSize}px`} dominantBaseline="central">
          {label}
        </text>
        <text x={cx - numberOffset} y={cy} dy={8} fill={fill} textAnchor={'middle'} font-size={`${numberFontSize}px`} dominantBaseline="central">
          {value}
        </text>
        <line x1={cx} x2={cx} y1={cy - 20} y2={cy + 20} stroke="#DEDEDE" stroke-width="1"/>
      </g>
    );
  }

  return (
    <g>
      <text x={cx + 90} y={cy + 75} fill={fill} textAnchor={'middle'} font-size={`${labelFontSize}px`}dominantBaseline="central">
        {label}
      </text>
      <text x={cx + numberOffset} y={cy} dy={8} fill={fill} textAnchor={'middle'} font-size={`${numberFontSize}px`}dominantBaseline="central">
        {value}
      </text>
    </g>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value } = props;
  // const sin = Math.sin(-RADIAN * midAngle);
  // const cos = Math.cos(-RADIAN * midAngle);
  // const sx = cx + (outerRadius + 10) * cos;
  // const sy = cy + (outerRadius + 10) * sin;
  // const mx = cx + (outerRadius + 30) * cos;
  // const my = cy + (outerRadius + 30) * sin;
  // const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  // const ey = my;
  // const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy - 10} dy={0} textAnchor="middle" fill={"#777"}>{payload.label}</text>
      <text x={cx} y={cy + 12} dy={10} textAnchor="middle" font-size={"2rem"} fill={"#777"}>{value}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={payload.label === 'Draws' ? '#CCC' : fill}
      />
    </g>
  );
};

const HeadToHeadPieChart = ({ pieData, activeIndex, onPieClick, largestValue, longestLabel }) => {
  const innerRadius = largestValue && largestValue > 999 ? 50 : 40;
  return (
    <ResponsiveContainer width={"100%"} height={200}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          data={pieData}
          dataKey="wins"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={75}
          innerRadius={innerRadius}
          fill="#8884d8"
          onClick={(data, index) => onPieClick(data, index)}
          label={renderLabel}
          labelLine={false}
          startAngle={270}
          endAngle={-90}
        >
        {
          pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.label === 'Draws' ? '#EFEFEF' : COLORS[index % COLORS.length]}/>)
        }
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default HeadToHeadPieChart;