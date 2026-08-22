'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code,
  Radio,
  Volume2,
} from 'lucide-react';

interface Station {
  id: string;
  name: string;
  frequency: string;
  status: 'online' | 'offline' | 'busy';
  location: string;
  coverage: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  online: { color: 'bg-green-400', label: 'Online' },
  busy: { color: 'bg-amber-400', label: 'Busy' },
  offline: { color: 'bg-red-400', label: 'Offline' },
};

const MOCK_STATIONS: Station[] = [
  { id: '1', name: 'All India Radio Patna', frequency: '101.4', status: 'online', location: 'Patna', coverage: '120 km' },
  { id: '2', name: 'Radio Mirchi', frequency: '98.3', status: 'online', location: 'Patna', coverage: '80 km' },
  { id: '3', name: 'Big FM', frequency: '92.7', status: 'busy', location: 'Patna', coverage: '100 km' },
  { id: '4', name: 'Red FM', frequency: '93.5', status: 'online', location: 'Patna', coverage: '90 km' },
  { id: '5', name: 'Radio City', frequency: '91.1', status: 'offline', location: 'Gaya', coverage: '60 km' },
  { id: '6', name: 'AIR Bihar', frequency: '102.6', status: 'online', location: 'Bihar', coverage: '200 km' },
];

const CAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>DRIP-2026-PA-0847</identifier>
  <sender>district-admin@patna.gov.in</sender>
  <sent>2026-08-21T10:30:00+05:30</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>hi</language>
    <event>Flood Warning</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <headline>FLOOD WARNING - Patna District</headline>
    <description>River Ganga crossing danger mark.</description>
    <instruction>Move to higher ground.</instruction>
  </info>
</alert>`;

const RDS_TEXT =
  'FLOOD WARNING: River Ganga rising. Patna residents prepare. Tune to AIR for updates.';

export function FMRadioPanel() {
  const [previewLang, setPreviewLang] = useState<'hi' | 'en'>('hi');
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [xmlExpanded, setXmlExpanded] = useState(false);
  const [ivrFallback, setIvrFallback] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  const handleTTSPlay = () => {
    if (ttsPlaying) return;
    setTtsPlaying(true);
    setTimeout(() => setTtsPlaying(false), 3000);
  };

  const handleBroadcast = () => {
    setShowBroadcastModal(true);
  };

  const confirmBroadcast = () => {
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      setBroadcastDone(true);
      setTimeout(() => {
        setBroadcastDone(false);
        setShowBroadcastModal(false);
      }, 2000);
    }, 2000);
  };

  const onlineCount = MOCK_STATIONS.filter((s) => s.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <Radio className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">FM Radio Integration</h2>
            <p className="text-sm text-gray-400">
              {onlineCount} of {MOCK_STATIONS.length} stations online
            </p>
          </div>
        </div>
      </div>

      {/* Station List */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-300">Available FM Stations</h3>
        <div className="space-y-2">
          {MOCK_STATIONS.map((station) => {
            const cfg = STATUS_CONFIG[station.status];
            return (
              <div
                key={station.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0a0f1a] p-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.color}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{station.name}</p>
                    <p className="text-xs text-gray-500">
                      {station.frequency} MHz &middot; {station.location} &middot;{' '}
                      {station.coverage} range
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    station.status === 'online'
                      ? 'bg-green-500/10 text-green-400'
                      : station.status === 'busy'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI TTS Preview */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-300">AI TTS Preview</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPreviewLang('hi');
              handleTTSPlay();
            }}
            disabled={ttsPlaying}
            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/20 disabled:opacity-50"
          >
            <Volume2 className="h-4 w-4" />
            Hindi
          </button>
          <button
            onClick={() => {
              setPreviewLang('en');
              handleTTSPlay();
            }}
            disabled={ttsPlaying}
            className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
          >
            <Volume2 className="h-4 w-4" />
            English
          </button>
          {ttsPlaying && (
            <span className="text-xs text-gray-400">
              Generating {previewLang === 'hi' ? 'Hindi' : 'English'} TTS...
            </span>
          )}
        </div>
      </div>

      {/* CAP XML Preview */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <button
          onClick={() => setXmlExpanded(!xmlExpanded)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-medium text-gray-300">CAP XML Preview</h3>
          </div>
          {xmlExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {xmlExpanded && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-[#0a0f1a] p-4 text-xs text-green-400">
            {CAP_XML}
          </pre>
        )}
      </div>

      {/* RDS Text Preview */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-300">RDS Text Preview</h3>
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[#0a0f1a] p-3">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-sm text-cyan-400">{RDS_TEXT}</span>
          </div>
        </div>
        <p className="mt-2 text-right text-xs text-gray-500">{RDS_TEXT.length}/64 characters</p>
      </div>

      {/* IVR Fallback */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111827] p-4">
        <div>
          <h3 className="text-sm font-medium text-gray-300">IVR Fallback</h3>
          <p className="text-xs text-gray-500">
            Enable voice call fallback for areas without FM coverage
          </p>
        </div>
        <button
          onClick={() => setIvrFallback(!ivrFallback)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            ivrFallback ? 'bg-purple-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              ivrFallback ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Broadcast Button */}
      <button
        onClick={handleBroadcast}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
      >
        <AlertTriangle className="h-4 w-4" />
        Broadcast to FM
      </button>

      {/* Broadcast Confirmation Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-[#111827] p-6">
            {broadcastDone ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                  <Radio className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-sm font-medium text-green-400">
                  Broadcast sent successfully
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Confirm Broadcast</h3>
                    <p className="text-xs text-gray-400">
                      This will send the alert to {onlineCount} active FM stations.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg bg-[#0a0f1a] p-3 text-xs text-gray-400">
                  <p>
                    <span className="text-gray-500">Alert ID:</span> DRIP-2026-PA-0847
                  </p>
                  <p>
                    <span className="text-gray-500">Type:</span> Flood Warning
                  </p>
                  <p>
                    <span className="text-gray-500">Region:</span> Patna District
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowBroadcastModal(false)}
                    disabled={broadcasting}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBroadcast}
                    disabled={broadcasting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {broadcasting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Broadcasting...
                      </>
                    ) : (
                      'Confirm Broadcast'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FMRadioPanel;
