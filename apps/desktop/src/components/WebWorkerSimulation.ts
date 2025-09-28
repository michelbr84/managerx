// Web Worker for non-blocking match simulation

export class SimulationWorker {
  private worker: Worker | null = null;

  constructor() {
    // Create worker from inline script to avoid external file dependency
    const workerScript = `
      // Import simulation engine (when available)
      // const { simulateMatch } = require('@managerx/core-sim');
      
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        if (type === 'SIMULATE_MATCH') {
          try {
            // Mock simulation for now
            const result = {
              homeScore: Math.floor(Math.random() * 4),
              awayScore: Math.floor(Math.random() * 4),
              stats: {
                possession: { 
                  home: 40 + Math.random() * 20, 
                  away: 40 + Math.random() * 20 
                },
                shots: { 
                  home: Math.floor(Math.random() * 15), 
                  away: Math.floor(Math.random() * 15) 
                },
                shotsOnTarget: { 
                  home: Math.floor(Math.random() * 8), 
                  away: Math.floor(Math.random() * 8) 
                },
                xG: { 
                  home: Math.random() * 3, 
                  away: Math.random() * 3 
                },
                passes: { 
                  home: 300 + Math.floor(Math.random() * 200), 
                  away: 300 + Math.floor(Math.random() * 200) 
                },
                passAccuracy: { 
                  home: 70 + Math.random() * 20, 
                  away: 70 + Math.random() * 20 
                },
                fouls: { 
                  home: Math.floor(Math.random() * 20), 
                  away: Math.floor(Math.random() * 20) 
                },
                corners: { 
                  home: Math.floor(Math.random() * 10), 
                  away: Math.floor(Math.random() * 10) 
                },
                yellowCards: { 
                  home: Math.floor(Math.random() * 5), 
                  away: Math.floor(Math.random() * 5) 
                },
                redCards: { 
                  home: Math.floor(Math.random() * 2), 
                  away: Math.floor(Math.random() * 2) 
                },
              },
              events: [
                {
                  minute: 23,
                  type: 'goal',
                  team: 'home',
                  player: 'João Silva',
                  description: 'GOAL! João Silva scores',
                  xG: 0.24
                }
              ],
              duration: 90 + Math.floor(Math.random() * 8)
            };
            
            // Simulate processing time
            setTimeout(() => {
              self.postMessage({ type: 'SIMULATION_COMPLETE', data: result });
            }, 100 + Math.random() * 200);
            
          } catch (error) {
            self.postMessage({ 
              type: 'SIMULATION_ERROR', 
              data: { error: error.message } 
            });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  simulateMatch(matchData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        const { type, data } = e.data;
        
        if (type === 'SIMULATION_COMPLETE') {
          this.worker?.removeEventListener('message', handleMessage);
          resolve(data);
        } else if (type === 'SIMULATION_ERROR') {
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(data.error));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({
        type: 'SIMULATE_MATCH',
        data: matchData
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
let simulationWorker: SimulationWorker | null = null;

export function getSimulationWorker(): SimulationWorker {
  if (!simulationWorker) {
    simulationWorker = new SimulationWorker();
  }
  return simulationWorker;
}

export function terminateSimulationWorker() {
  if (simulationWorker) {
    simulationWorker.terminate();
    simulationWorker = null;
  }
}
