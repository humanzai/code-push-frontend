import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PieChart, Pie, Cell } from "recharts";

interface RolloutChartComponentProps {
  rollout: number;
}

const RolloutChartComponent: React.FC<RolloutChartComponentProps> = ({
  rollout,
}) => {
  const data = [
    { name: "Rolled Out", value: rollout },
    { name: "Remaining", value: 100 - rollout > 0 ? 100 - rollout : 0 },
  ];
  const COLORS = ["#4fc3f7", "rgba(29, 29, 42, 0.5)"]; // Blue for rollout, transparent dark for remaining

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "40px",
        height: "40px",
        margin: "auto",
        position: "relative",
      }}
    >
      {data.every((item) => item.value === 0) ? (
        <Typography
          variant="caption"
          sx={{ color: "white", textAlign: "center" }}
        >
          No data
        </Typography>
      ) : (
        <>
          <PieChart width={60} height={60}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={450}
              innerRadius={25}
              outerRadius={30}
              paddingAngle={5}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "10px",
            }}
          >
            {rollout}%
          </Typography>
        </>
      )}
    </Box>
  );
};

export default RolloutChartComponent;
