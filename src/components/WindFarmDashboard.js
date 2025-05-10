import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Wind, Activity, Thermometer, ExternalLink } from 'lucide-react';

const WindFarmDashboard = () => {
  // Estado inicial dos aerogeradores
  const [turbines, setTurbines] = useState([
    { id: 1, name: 'Aerogerador 01', status: 'healthy', power: 2.1, rpm: 15, temp: 42, location: 'Setor Norte' },
    { id: 2, name: 'Aerogerador 02', status: 'error', power: 0.8, rpm: 7, temp: 65, location: 'Setor Norte' },
    { id: 3, name: 'Aerogerador 03', status: 'healthy', power: 1.9, rpm: 14, temp: 45, location: 'Setor Norte' },
    { id: 4, name: 'Aerogerador 04', status: 'healthy', power: 2.2, rpm: 16, temp: 40, location: 'Setor Leste' },
    { id: 5, name: 'Aerogerador 05', status: 'error', power: 0.5, rpm: 5, temp: 38, location: 'Setor Leste' },
    { id: 6, name: 'Aerogerador 06', status: 'healthy', power: 2.0, rpm: 15, temp: 43, location: 'Setor Leste' },
    { id: 7, name: 'Aerogerador 07', status: 'healthy', power: 1.8, rpm: 13, temp: 44, location: 'Setor Oeste' },
    { id: 8, name: 'Aerogerador 08', status: 'error', power: 0.3, rpm: 3, temp: 70, location: 'Setor Oeste' },
    { id: 9, name: 'Aerogerador 09', status: 'healthy', power: 2.1, rpm: 15, temp: 42, location: 'Setor Sul' },
    { id: 10, name: 'Aerogerador 10', status: 'healthy', power: 2.0, rpm: 15, temp: 43, location: 'Setor Sul' },
  ]);

  const [selectedTurbine, setSelectedTurbine] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Função para simular mudança aleatória no status dos aerogeradores
  const simulateStatusChange = () => {
    const updatedTurbines = turbines.map(turbine => {
      // 10% de chance de mudar o status
      if (Math.random() < 0.1) {
        if (turbine.status === 'healthy') {
          return {
            ...turbine,
            status: 'error',
            power: turbine.power * 0.4,
            rpm: turbine.rpm * 0.5,
          };
        } else {
          return {
            ...turbine,
            status: 'healthy',
            power: 1.8 + Math.random() * 0.5,
            rpm: 13 + Math.floor(Math.random() * 4),
            temp: 40 + Math.floor(Math.random() * 6),
          };
        }
      }
      return turbine;
    });
    
    setTurbines(updatedTurbines);
  };

  // Filtrar aerogeradores com erro
  const errorTurbines = turbines.filter(turbine => turbine.status === 'error');
  
  // Componente para o mapa usando Leaflet
  const MapComponent = ({ lat, lon, turbines, onTurbineSelect }) => {
    const mapRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
      // Carrega os scripts e estilos do Leaflet
      const loadLeaflet = async () => {
        try {
          // Criar elemento link para o CSS do Leaflet
          const linkElement = document.createElement('link');
          linkElement.rel = 'stylesheet';
          linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
          document.head.appendChild(linkElement);
          
          // Criar elemento script para o JS do Leaflet
          const scriptElement = document.createElement('script');
          scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
          document.body.appendChild(scriptElement);
          
          scriptElement.onload = initializeMap;
        } catch (error) {
          console.error('Erro ao carregar Leaflet:', error);
        }
      };
      
      const initializeMap = () => {
        // Certifique-se de que o Leaflet está carregado e o contêiner está disponível
        if (window.L && mapRef.current) {
          try {
            // Inicializar o mapa Leaflet
            const map = window.L.map(mapRef.current).setView([lat, lon], 14);
            
            // Adicionar camada de tiles do OpenStreetMap
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19
            }).addTo(map);
            
            // Adicionar marcadores para cada aerogerador
            turbines.forEach((turbine, index) => {
              // Calcular coordenadas para cada aerogerador
              const deltaLat = (index % 2 === 0) ? 0.005 * (Math.floor(index / 2) + 1) : -0.005 * (Math.floor(index / 2) + 1);
              const deltaLon = (index % 4 < 2) ? 0.002 * (index % 2 + 1) : -0.002 * (index % 2 + 1);
              
              const turbineLat = lat + deltaLat;
              const turbineLon = lon + deltaLon;
              
              // Criar ícone personalizado baseado no status
              const iconColor = turbine.status === 'healthy' ? 'green' : 'red';
              const markerHtml = `
                <div class="relative">
                  <div class="w-8 h-8 rounded-full bg-${iconColor}-500 flex items-center justify-center shadow-md border-2 border-white">
                    <div class="text-white">${turbine.id}</div>
                  </div>
                  ${turbine.status === 'error' ? '<div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-red-600 border border-white animate-pulse"></div>' : ''}
                </div>
              `;
              
              const customIcon = window.L.divIcon({
                html: markerHtml,
                className: 'custom-div-icon',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              
              // Adicionar marcador ao mapa
              const marker = window.L.marker([turbineLat, turbineLon], { icon: customIcon })
                .addTo(map)
                .on('click', () => onTurbineSelect(turbine));
              
              // Adicionar popup
              marker.bindPopup(`
                <div>
                  <div class="font-medium">${turbine.name}</div>
                  <div>Potência: ${turbine.power.toFixed(1)} MW</div>
                  <div>Status: ${turbine.status === 'healthy' ? 'Saudável' : 'Com problema'}</div>
                </div>
              `);
            });
            
            // Adicionar overlay com legenda
            const legendControl = window.L.control({ position: 'bottomright' });
            legendControl.onAdd = function() {
              const div = window.L.DomUtil.create('div', 'info legend bg-white p-2 rounded shadow-sm');
              div.innerHTML = `
                <div class="text-xs font-medium mb-1">Legenda:</div>
                <div class="flex items-center text-xs mb-1">
                  <div class="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Aerogerador saudável</span>
                </div>
                <div class="flex items-center text-xs">
                  <div class="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Aerogerador com problema</span>
                </div>
              `;
              return div;
            };
            legendControl.addTo(map);
            
            setMapLoaded(true);
          } catch (error) {
            console.error('Erro ao inicializar mapa:', error);
          }
        }
      };
      
      loadLeaflet();
      
      // Cleanup
      return () => {
        // Remove os elementos carregados dinamicamente ao desmontar
        const leafletStyle = document.querySelector('link[href*="leaflet.min.css"]');
        const leafletScript = document.querySelector('script[src*="leaflet.min.js"]');
        
        if (leafletStyle) leafletStyle.remove();
        if (leafletScript) leafletScript.remove();
      };
    }, [lat, lon, turbines, onTurbineSelect]);

    return (
      <div className="relative w-full h-full">
        {/* Contenedor para o mapa do Leaflet */}
        <div ref={mapRef} className="w-full h-full"></div>
        
        {/* Título do mapa */}
        <div className="absolute top-2 left-2 z-[1000] bg-white bg-opacity-90 rounded p-2 shadow-sm">
          <h3 className="font-medium text-gray-800">Parque Eólico - Canoa Quebrada, CE</h3>
          <p className="text-sm text-gray-600">10 aerogeradores - 20 MW capacidade total</p>
        </div>
        
        {/* Carregando indicador */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[2000]">
            <div className="text-gray-600 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-2"></div>
              <span>Carregando mapa do OpenStreetMap...</span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar - Alertas de Erro */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 bg-red-600 text-white font-bold flex items-center">
          <AlertTriangle className="mr-2" size={20} />
          <span>Alertas ({errorTurbines.length})</span>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {errorTurbines.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhum alerta ativo
            </div>
          ) : (
            errorTurbines.map(turbine => (
              <div 
                key={turbine.id}
                className="p-3 border-b border-gray-200 hover:bg-red-50 cursor-pointer"
                onClick={() => setSelectedTurbine(turbine)}
              >
                <div className="font-medium text-red-600">{turbine.name}</div>
                <div className="text-sm text-gray-600">{turbine.location}</div>
                <div className="text-xs text-gray-500 mt-1">Há 23 minutos</div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={simulateStatusChange}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Simular Mudanças
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard de Monitoramento - Parque Eólico de Canoa Quebrada, CE</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-sm">Operacionais: {turbines.filter(t => t.status === 'healthy').length}</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-sm">Com problemas: {errorTurbines.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button 
              className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              onClick={() => setActiveTab('overview')}
            >
              Visão Geral
            </button>
            <button 
              className={`px-4 py-3 font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              onClick={() => setActiveTab('details')}
            >
              Detalhes Técnicos
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {activeTab === 'overview' && (
            <div className="relative">
              {/* Mapa usando Leaflet */}
              <div className="relative w-full h-96 md:h-[600px] bg-gray-100 rounded-lg shadow-sm overflow-hidden">
                {/* Container para o mapa integrado */}
                <div className="absolute inset-0 bg-white">
                  <MapComponent 
                    lat={-4.467065}
                    lon={-37.756530}
                    turbines={turbines}
                    onTurbineSelect={setSelectedTurbine}
                  />
                </div>
              </div>
              
              {/* Lista de status resumidos abaixo do mapa */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                {turbines.map(turbine => (
                  <div 
                    key={turbine.id}
                    className={`p-2 rounded ${turbine.status === 'healthy' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'} cursor-pointer flex justify-between items-center`}
                    onClick={() => setSelectedTurbine(turbine)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${turbine.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                      <span className="text-sm font-medium">{turbine.name}</span>
                    </div>
                    <span className="text-sm">{turbine.power.toFixed(1)} MW</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">Detalhes Técnicos dos Aerogeradores</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potência (MW)</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RPM</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperatura (°C)</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {turbines.map(turbine => (
                      <tr 
                        key={turbine.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${turbine.status === 'error' ? 'bg-red-50' : ''}`}
                        onClick={() => setSelectedTurbine(turbine)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">{turbine.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            turbine.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {turbine.status === 'healthy' ? 'Saudável' : 'Problema'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{turbine.power.toFixed(1)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{turbine.rpm}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={turbine.temp > 60 ? 'text-red-600 font-medium' : ''}>
                            {turbine.temp}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{turbine.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal de detalhes do aerogerador */}
        {selectedTurbine && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
              <div className={`p-4 ${selectedTurbine.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'} text-white flex justify-between items-center`}>
                <h2 className="text-lg font-semibold">{selectedTurbine.name} - Detalhes</h2>
                <button 
                  onClick={() => setSelectedTurbine(null)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className={`text-lg font-medium ${selectedTurbine.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedTurbine.status === 'healthy' ? 'Saudável' : 'Problema Detectado'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center text-gray-500 mb-1">
                      <Activity size={16} className="mr-1" />
                      <span className="text-sm">Potência</span>
                    </div>
                    <div className="text-lg font-medium">{selectedTurbine.power.toFixed(1)} MW</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center text-gray-500 mb-1">
                      <Wind size={16} className="mr-1" />
                      <span className="text-sm">RPM</span>
                    </div>
                    <div className="text-lg font-medium">{selectedTurbine.rpm}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center text-gray-500 mb-1">
                      <Thermometer size={16} className="mr-1" />
                      <span className="text-sm">Temperatura</span>
                    </div>
                    <div className={`text-lg font-medium ${selectedTurbine.temp > 60 ? 'text-red-600' : ''}`}>
                      {selectedTurbine.temp}°C
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-3">Histórico de Potência (24h)</h3>
                  <div className="h-32 flex items-center justify-center text-gray-400">
                    <Activity size={32} className="mr-2 opacity-30" />
                    <span>Gráfico de histórico seria exibido aqui</span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    onClick={() => setSelectedTurbine(null)}
                  >
                    Fechar
                  </button>
                  {selectedTurbine.status === 'error' && (
                    <button 
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        alert('Enviando equipe de manutenção para ' + selectedTurbine.name);
                        setSelectedTurbine(null);
                      }}
                    >
                      Enviar Manutenção
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WindFarmDashboard;
