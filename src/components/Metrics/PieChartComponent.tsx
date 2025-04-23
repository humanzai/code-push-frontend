import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PieChart, Pie, Cell } from "recharts";

interface PieChartComponentProps {
  active: number;
  total: number;
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  active,
  total,
}) => {
  const inactive = total - active;
  const data = [
    { name: "Active", value: active },
    { name: "Inactive", value: inactive > 0 ? inactive : 0 },
  ];
  const COLORS = ["#81c784", "rgba(29, 29, 42, 0.5)"]; // Green for active, transparent dark for inactive
  const percentage = total > 0 ? Math.round((active / total) * 100) : 0;

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
            {percentage}%
          </Typography>
        </>
      )}
    </Box>
  );
};

export default PieChartComponent;
