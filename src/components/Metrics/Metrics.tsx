import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircleIcon from "@mui/icons-material/Circle";

interface MetricsProps {
  metrics: Record<string, number | null>;
  aggregatedMetrics?: { active: number }; // New prop for aggregated metrics
}

const Metrics: React.FC<MetricsProps> = ({ metrics, aggregatedMetrics }) => {
  const active = metrics?.active || 0;
  const total = aggregatedMetrics?.active || 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "5px",
        padding: "5px",
        backgroundColor: "rgba(44, 44, 62, 0.8)",
        borderRadius: "8px",
      }}
    >
      {Object.entries(metrics).map(([key, value]) => (
        <Chip
          key={key}
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
              {key === "active" && (
                <CircleIcon
                  sx={{
                    fontSize: "10px",
                    color: value && value > 0 ? "#81c784" : "#ff6f61",
                  }}
                />
              )}
              {`${key}: ${value !== null ? value : "N/A"}`}
            </Box>
          }
          sx={{
            backgroundColor: "rgba(124, 77, 255, 0.2)",
            color: "white",
            fontWeight: "bold",
            borderRadius: "16px",
          }}
        />
      ))}
    </Box>
  );
};

export default Metrics;
