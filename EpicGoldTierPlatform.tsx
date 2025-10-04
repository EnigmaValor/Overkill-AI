import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart } from 'recharts';
import { Shield, Lock, DollarSign, TrendingUp, Briefcase, Users, FileText, Award, Globe, Eye, EyeOff, Key, Database, Cloud, CheckCircle, AlertTriangle, Crown, Gem, Zap, Target, ChevronRight, Plus, X, Download, Upload, Activity } from 'lucide-react';
import CryptoJS from 'crypto-js';

interface PremiumService {
  id: string;
  name: string;
  category: string;
  hourlyRate: number;
  description: string;
  certifications: string[];
  ndaRequired: boolean;
  isActive: boolean;
  valuation: number;
}

interface EnterpriseClient {
  id: string;
  name: string;
  industry: string;
  revenue: string;
  contactEmail: string;
  totalSpent: number;
  projects: number;
  contractValue: number;
  securityClearance: string;
  rating: number;
}

interface Contract {
  id: string;
  clientId: string;
  serviceId: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'completed' | 'terminated';
  encrypted: boolean;
  ipProtection: boolean;
}

interface SecurityMetric {
  name: string;
  value: number;
  max: number;
  status: 'secure' | 'warning' | 'critical';
}

export default function EpicGoldTierPlatform() {
  const [services, setServices] = useState<PremiumService[]>([
    { id: '1', name: 'AI Strategi Rådgivning', category: 'Teknologi', hourlyRate: 800, description: 'Enterprise AI transformation og implementering', certifications: ['AWS ML', 'Google AI', 'MIT AI'], ndaRequired: true, isActive: true, valuation: 2500000 },
    { id: '2', name: 'Cybersikkerhed Arkitektur', category: 'Sikkerhed', hourlyRate: 750, description: 'Avanceret sikkerhedsinfrastruktur design', certifications: ['CISSP', 'CEH', 'CompTIA Security+'], ndaRequired: true, isActive: true, valuation: 2000000 },
    { id: '3', name: 'M&A Due Diligence', category: 'Finans', hourlyRate: 900, description: 'Teknisk due diligence for fusioner og opkøb', certifications: ['CFA', 'CPA', 'MBA'], ndaRequired: true, isActive: true, valuation: 3000000 },
    { id: '4', name: 'Quantum Computing Rådgivning', category: 'Forskning', hourlyRate: 1000, description: 'Quantum computing strategi og implementering', certifications: ['IBM Quantum', 'Microsoft Quantum'], ndaRequired: true, isActive: true, valuation: 5000000 },
  ]);

  const [clients, setClients] = useState<EnterpriseClient[]>([
    { id: '1', name: 'Fortune 500 Tech Corp', industry: 'Teknologi', revenue: '$50B+', contactEmail: 'executive@techcorp.com', totalSpent: 2500000, projects: 12, contractValue: 500000, securityClearance: 'Top Secret', rating: 5 },
    { id: '2', name: 'Global Investment Bank', industry: 'Finans', revenue: '$100B+', contactEmail: 'cfo@bank.com', totalSpent: 3200000, projects: 8, contractValue: 750000, securityClearance: 'Secret', rating: 4.8 },
    { id: '3', name: 'Government Defense Agency', industry: 'Forsvar', revenue: 'Klassificeret', contactEmail: 'secure@gov.gov', totalSpent: 5000000, projects: 20, contractValue: 1000000, securityClearance: 'TS/SCI', rating: 5 },
  ]);

  const [contracts, setContracts] = useState<Contract[]>([
    { id: '1', clientId: '1', serviceId: '1', title: 'Enterprise AI Transformation', value: 2500000, startDate: '2024-01-01', endDate: '2024-12-31', status: 'active', encrypted: true, ipProtection: true },
    { id: '2', clientId: '2', serviceId: '3', title: 'M&A Teknisk Vurdering', value: 1800000, startDate: '2024-02-01', endDate: '2024-05-31', status: 'active', encrypted: true, ipProtection: true },
    { id: '3', clientId: '3', serviceId: '4', title: 'Quantum Sikkerhed Framework', value: 5000000, startDate: '2024-03-01', endDate: '2025-03-01', status: 'pending', encrypted: true, ipProtection: true },
  ]);

  const [showEncryption, setShowEncryption] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: '', category: '', hourlyRate: 600, description: '', ndaRequired: true });
  const [targetHourlyRate] = useState(600);
  const [platformValuation, setPlatformValuation] = useState(1000000);

  const totalRevenue = contracts.reduce((sum, contract) => sum + contract.value, 0);
  const activeContractsValue = contracts.filter(c => c.status === 'active').reduce((sum, contract) => sum + contract.value, 0);
  const averageHourlyRate = services.reduce((sum, service) => sum + service.hourlyRate, 0) / services.length;
  const totalValuation = services.reduce((sum, service) => sum + service.valuation, 0) + platformValuation;

  const revenueData = [
    { month: 'Jan', revenue: 450000, contracts: 3 },
    { month: 'Feb', revenue: 680000, contracts: 5 },
    { month: 'Mar', revenue: 920000, contracts: 7 },
    { month: 'Apr', revenue: 1200000, contracts: 9 },
    { month: 'May', revenue: 1500000, contracts: 12 },
    { month: 'Jun', revenue: 1850000, contracts: 15 },
  ];

  const securityMetrics: SecurityMetric[] = [
    { name: 'Encryption', value: 100, max: 100, status: 'secure' },
    { name: 'Firewall', value: 98, max: 100, status: 'secure' },
    { name: 'Access Control', value: 95, max: 100, status: 'secure' },
    { name: 'Audit Trail', value: 100, max: 100, status: 'secure' },
    { name: 'Compliance', value: 99, max: 100, status: 'secure' },
  ];

  const radarData = [
    { subject: 'Indkomst', A: 95, fullMark: 100 },
    { subject: 'Sikkerhed', A: 98, fullMark: 100 },
    { subject: 'Kunde Kvalitet', A: 92, fullMark: 100 },
    { subject: 'IP Beskyttelse', A: 100, fullMark: 100 },
    { subject: 'Markedsposition', A: 88, fullMark: 100 },
    { subject: 'Skalerbarhed', A: 85, fullMark: 100 },
  ];

  const handleAddService = () => {
    if (newService.name && newService.category) {
      const service: PremiumService = {
        id: Date.now().toString(),
        ...newService,
        certifications: [],
        isActive: true,
        valuation: newService.hourlyRate * 2000,
      };
      setServices([...services, service]);
      setNewService({ name: '', category: '', hourlyRate: 600, description: '', ndaRequired: true });
      setShowAddService(false);
    }
  };

  const encryptData = (data: string) => {
    if (encryptionKey) {
      return CryptoJS.AES.encrypt(data, encryptionKey).toString();
    }
    return data;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="bg-black bg-opacity-50 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Crown className="w-8 h-8 text-yellow-500" />
                <Gem className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Epic Gold Tier</h1>
                <p className="text-gray-400 mt-1">Enterprise Consulting Platform<br />Værdiansættelse: ${(totalValuation / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowEncryption(!showEncryption)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Sikkerhedspakke
              </button>
              <button
                onClick={() => setShowAddService(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Tilføj Premium Service
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Samlet Indkomst</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">${(totalRevenue / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-gray-500 mt-1">Livstids indtjening</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Gennemsnitlig Timepris</p>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">${averageHourlyRate.toFixed(0)}/time</p>
            <p className="text-xs text-gray-500 mt-1">Mål: ${targetHourlyRate}/time</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Aktive Kontrakter</p>
              <Briefcase className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-white">${(activeContractsValue / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-gray-500 mt-1">Nuværende pipeline</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Platform Værdi</p>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">${(totalValuation / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">Enterprise værdiansættelse</p>
          </div>
        </div>

        {showEncryption && (
          <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-green-500" />
                Militær Sikkerhedspakke
              </h2>
              <button
                onClick={() => setShowEncryption(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Sikkerhedsmålinger</h3>
                <div className="space-y-3">
                  {securityMetrics.map((metric, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">{metric.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          metric.status === 'secure' ? 'bg-green-900 text-green-300' :
                          metric.status === 'warning' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {metric.status === 'secure' ? 'SIKKER' :
                           metric.status === 'warning' ? 'ADVARSEL' :
                           'KRITISK'}
                        </span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            metric.status === 'secure' ? 'bg-green-500' :
                            metric.status === 'warning' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(metric.value / metric.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Krypteringskontrol</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Master Krypteringsnøgle</label>
                      <input
                        type="password"
                        value={encryptionKey}
                        onChange={(e) => setEncryptionKey(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Indtast krypteringsnøgle..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        Krypter Alle Data
                      </button>
                      <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <Key className="w-4 h-4" />
                        Generer Nøgle
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                        <Database className="w-4 h-4" />
                        Backup Krypteret
                      </button>
                      <button className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Sikker Cloud Sync
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Indkomst Vækstbane</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Platform Ydelses Metrics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                <Radar name="Performance" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Premium Services</h2>
              <button
                onClick={() => setShowAddService(true)}
                className="text-yellow-500 hover:text-yellow-400 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Tilføj Premium
              </button>
            </div>
            <div className="space-y-3">
              {services.map(service => (
                <div key={service.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{service.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          service.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {service.isActive ? 'AKTIV' : 'INAKTIV'}
                        </span>
                        {service.ndaRequired && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-900 text-red-300">
                            NDA PÅKRÆVET
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-lg font-bold text-yellow-500">${service.hourlyRate}/time</span>
                        <span className="text-sm text-gray-400">Værdiansættelse: ${(service.valuation / 1000000).toFixed(1)}M</span>
                      </div>
                      {service.certifications.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {service.certifications.map((cert, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Enterprise Kontrakter</h2>
            <div className="space-y-3">
              {contracts.map(contract => {
                const client = clients.find(c => c.id === contract.clientId);
                const service = services.find(s => s.id === contract.serviceId);
                return (
                  <div key={contract.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{contract.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            contract.status === 'active' ? 'bg-green-900 text-green-300' :
                            contract.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                            contract.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {contract.status === 'active' ? 'AKTIV' :
                             contract.status === 'pending' ? 'VENTER' :
                             contract.status === 'completed' ? 'FULDFØRT' :
                             'OPSAGT'}
                          </span>
                          {contract.encrypted && (
                            <Lock className="w-4 h-4 text-green-500" />
                          )}
                          {contract.ipProtection && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{client?.name}<br />{service?.name}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-lg font-bold text-green-500">${(contract.value / 1000000).toFixed(2)}M</span>
                          <span className="text-sm text-gray-400">{contract.startDate} - {contract.endDate}</span>
                        </div>
                      </div>
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Crown className="w-8 h-8" />
                Epic Gold Tier Præstation
              </h2>
              <p className="text-yellow-100">Du har overgået $600/time målet med en ${averageHourlyRate.toFixed(0)}/time gennemsnitspris</p>
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <p className="text-sm text-yellow-200">Platform Klar til Exit</p>
                  <p className="text-3xl font-bold text-white">${(totalValuation / 1000000).toFixed(1)}M Værdiansættelse</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <p className="text-sm text-yellow-200">Næste Milepæl</p>
                  <p className="text-lg font-bold text-white">$10M Platform</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Gem className="w-20 h-20 text-yellow-300 opacity-50" />
              <p className="text-sm text-yellow-200 mt-2">Enterprise Grade</p>
            </div>
          </div>
        </div>
      </div>

      {showAddService && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Tilføj Premium Service</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Service Navn</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="f.eks., Quantum Computing Advisory"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Kategori</label>
                <input
                  type="text"
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="f.eks., Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Timepris ($)</label>
                <input
                  type="number"
                  value={newService.hourlyRate}
                  onChange={(e) => setNewService({ ...newService, hourlyRate: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="600"
                  min="600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Beskrivelse</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Beskriv din premium service..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newService.ndaRequired}
                  onChange={(e) => setNewService({ ...newService, ndaRequired: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded"
                />
                <label className="text-sm text-gray-300">NDA Påkrævet</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddService(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={handleAddService}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
              >
                Tilføj Premium Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}