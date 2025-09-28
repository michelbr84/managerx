import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Download, Trash2, Settings } from 'lucide-react';
import { getTelemetryCollector, exportTelemetryData, clearTelemetryData } from '@managerx/analytics';

interface TelemetryConsentProps {
  onConsentChange: (consent: boolean) => void;
  currentConsent: boolean;
}

export const TelemetryConsent: React.FC<TelemetryConsentProps> = ({
  onConsentChange,
  currentConsent,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const handleConsentChange = (consent: boolean) => {
    onConsentChange(consent);
    
    // Update telemetry collector
    const collector = getTelemetryCollector();
    collector.updateConsent(consent);
  };

  const handleExportData = () => {
    try {
      const data = exportTelemetryData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `managerx-telemetry-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export telemetry data:', error);
    }
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja excluir todos os dados de telemetria?')) {
      clearTelemetryData();
      alert('Dados de telemetria excluídos com sucesso.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start gap-4">
        <Shield size={24} className="text-blue-400 flex-shrink-0 mt-1" />
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Telemetria e Analytics
          </h3>
          
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            O ManagerX pode coletar dados anônimos de uso para melhorar a experiência do jogo. 
            Nenhuma informação pessoal é coletada e você pode desativar a qualquer momento.
          </p>

          {/* Consent toggle */}
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentConsent}
                onChange={(e) => handleConsentChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-white">
                Permitir coleta de dados anônimos
              </span>
            </label>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 underline"
          >
            {showDetails ? 'Ocultar detalhes' : 'Ver detalhes sobre os dados coletados'}
          </button>

          {/* Details panel */}
          {showDetails && (
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h4 className="text-white font-medium mb-3">Dados Coletados (Anônimos)</h4>
              
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>• Tempo de sessão e frequência de uso</span>
                  <span className="text-green-400">✓ Anônimo</span>
                </div>
                <div className="flex justify-between">
                  <span>• Partidas simuladas e estatísticas</span>
                  <span className="text-green-400">✓ Anônimo</span>
                </div>
                <div className="flex justify-between">
                  <span>• Mudanças táticas e preferências</span>
                  <span className="text-green-400">✓ Anônimo</span>
                </div>
                <div className="flex justify-between">
                  <span>• Performance e tempo de carregamento</span>
                  <span className="text-green-400">✓ Anônimo</span>
                </div>
                <div className="flex justify-between">
                  <span>• Erros e crashes (sem dados pessoais)</span>
                  <span className="text-green-400">✓ Anônimo</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-600 rounded">
                <h5 className="text-white font-medium mb-2">🔒 Garantias de Privacidade</h5>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Nomes de técnicos e dados pessoais são removidos ou hash</li>
                  <li>• Dados armazenados localmente, não enviados automaticamente</li>
                  <li>• Retenção máxima de 30 dias</li>
                  <li>• Você pode exportar ou excluir seus dados a qualquer momento</li>
                  <li>• Conformidade com LGPD e GDPR</li>
                </ul>
              </div>
            </div>
          )}

          {/* Data management controls */}
          {currentConsent && (
            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                <Download size={16} />
                Exportar Meus Dados
              </button>
              
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              >
                <Trash2 size={16} />
                Excluir Dados
              </button>
            </div>
          )}

          {!currentConsent && (
            <div className="text-sm text-gray-400">
              <p>
                💡 Habilitar telemetria nos ajuda a melhorar o jogo com base no uso real. 
                Todos os dados são anônimos e você mantém controle total.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
