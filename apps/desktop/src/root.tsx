import React from "react";
import { Button } from "@managerx/ui";
import { simulateMatch } from "@managerx/core-sim";

export const App: React.FC = () => {
  const [score, setScore] = React.useState<string>("");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">ManagerX</h1>
      <div>
        <Button
          onClick={() => {
            const result = simulateMatch("demo-seed");
            setScore(`${result.homeGoals} - ${result.awayGoals}`);
          }}
        >
          Simular Partida
        </Button>
      </div>
      {score && <p className="text-lg">Placar: {score}</p>}
    </div>
  );
};

