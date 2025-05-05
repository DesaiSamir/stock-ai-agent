import React from "react";
import { AgentStatus } from "../../types/stock";
import { Card } from "../core/Card";
import { Alert } from "../core/Alert";

interface AgentStatusCardProps {
  status: AgentStatus;
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ status }) => {
  const getSeverity = () => {
    switch (status.status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "ERROR":
        return "error";
      default:
        return "info";
    }
  };

  return (
    <Card title={status.name} subheader={status.type}>
      <Alert severity={getSeverity()}>
        Status: {status.status}
        <br />
        Last Updated: {status.lastUpdated.toLocaleString()}
      </Alert>
    </Card>
  );
};
