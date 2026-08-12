"use client";

import { useState } from "react";
import {
  CloudRain,
  MessageSquare,
  Satellite,
  Webhook,
  Activity,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { showToast } from "@/components/ui/Toast";
import {
  IntegrationsSettingsProvider,
  useIntegrationSettings,
} from "@/lib/integrations-settings-mock";

const inputClass =
  "w-full rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent";

function IntegrationCard({
  title,
  description,
  icon: Icon,
  status,
  lastConnected,
  apiKey,
  onApiKeyChange,
  onTestConnection,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "green" | "amber" | "red";
  lastConnected: string;
  apiKey: string;
  onApiKeyChange?: (val: string) => void;
  onTestConnection: () => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const statusColors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  const handleTest = async () => {
    setIsTesting(true);
    await new Promise((r) => setTimeout(r, 1000));
    onTestConnection();
    setIsTesting(false);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-[var(--bg-secondary)] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary text-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">{title}</h3>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">{lastConnected}</span>
          <div
            className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`}
            title={`Status: ${status}`}
          />
        </div>
      </div>

      <div className="mt-2 flex items-end gap-3">
        {onApiKeyChange !== undefined && (
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="Enter API key..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-300"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-tertiary px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-slate-100 disabled:opacity-50"
        >
          {isTesting ? (
            "Testing..."
          ) : (
            <>
              <Activity className="h-4 w-4" /> Test
            </>
          )}
        </button>
      </div>
    </div>
  );
}

type CustomApiConnection = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
};

function CustomApiConnectionsCard() {
  const [connections, setConnections] = useState<CustomApiConnection[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const handleAdd = () => {
    if (!newName.trim() || !newBaseUrl.trim()) {
      showToast("error", { title: "Name and Base URL are required." });
      return;
    }
    setConnections((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: newName.trim(), baseUrl: newBaseUrl.trim(), apiKey: newApiKey.trim() },
    ]);
    setNewName("");
    setNewBaseUrl("");
    setNewApiKey("");
    setShowAdd(false);
    showToast("success", { title: "Connection Added", description: `${newName} has been saved.` });
  };

  const handleRemove = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    showToast("success", { title: "Connection Removed" });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-[var(--bg-secondary)] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary text-muted">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">Custom API Connections</h3>
            <p className="text-xs text-muted">Connect arbitrary REST APIs for external data sources or services.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex h-8 items-center gap-1.5 rounded-md bg-accent/15 px-3 text-xs font-semibold text-accent transition hover:bg-accent/25"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Connection
        </button>
      </div>

      {showAdd && (
        <div className="flex flex-col gap-3 rounded-lg border border-subtle bg-tertiary/50 p-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Connection name (e.g. District Sensor Feed)"
            className={inputClass}
          />
          <input
            type="url"
            value={newBaseUrl}
            onChange={(e) => setNewBaseUrl(e.target.value)}
            placeholder="Base URL (https://api.example.com)"
            className={inputClass}
          />
          <div className="relative">
            <input
              type={showKey["new"] ? "text" : "password"}
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="API key (optional)"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowKey((p) => ({ ...p, new: !p["new"] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-300"
            >
              {showKey["new"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {connections.length === 0 && !showAdd && (
        <p className="py-4 text-center text-xs text-muted">
          No custom connections configured. Add one to integrate external APIs.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="flex items-center justify-between rounded-lg border border-subtle bg-tertiary/30 px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-slate-200">{conn.name}</span>
              <span className="truncate text-xs text-muted">{conn.baseUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKey((p) => ({ ...p, [conn.id]: !p[conn.id] }))}
                className="text-muted hover:text-slate-300"
              >
                {showKey[conn.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleRemove(conn.id)}
                className="text-muted hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const { settings, setWeatherApiKey } = useIntegrationSettings();

  const handleTestSuccess = (service: string) => {
    showToast("success", {
      title: "Connection Successful",
      description: `Successfully pinged ${service} API.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection
        title="API Integrations"
        description="Manage upstream data providers, communications gateways, and webhooks."
        icon={Webhook}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <IntegrationCard
            title="Weather API (IMD/OpenWeather)"
            description="Hydrology and precipitation telemetry."
            icon={CloudRain}
            status="green"
            lastConnected="2 mins ago"
            apiKey={settings.weatherApiKeys?.openweather || ""}
            onApiKeyChange={(val) => setWeatherApiKey("openweather", val)}
            onTestConnection={() => handleTestSuccess("Weather API")}
          />

          <IntegrationCard
            title="Twilio SMS/Voice"
            description="Outbound emergency alert delivery."
            icon={MessageSquare}
            status="amber"
            lastConnected="1 hour ago"
            apiKey="tw_live_*******************"
            onTestConnection={() => handleTestSuccess("Twilio Gateway")}
          />

          <IntegrationCard
            title="ISRO Satellite GIS"
            description="High-resolution multispectral imagery."
            icon={Satellite}
            status="green"
            lastConnected="12 hours ago"
            apiKey="isro_gis_****************"
            onTestConnection={() => handleTestSuccess("ISRO GIS")}
          />

          <IntegrationCard
            title="State Gov Webhook"
            description="Real-time syncing with disaster relief fund portal."
            icon={Webhook}
            status="green"
            lastConnected="just now"
            apiKey="wh_sec_******************"
            onTestConnection={() => handleTestSuccess("State Gov Webhook")}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Custom Connections"
        description="Add arbitrary REST API endpoints for external data sources."
        icon={Plus}
      >
        <CustomApiConnectionsCard />
      </SettingsSection>
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <IntegrationsSettingsProvider>
      <IntegrationsContent />
    </IntegrationsSettingsProvider>
  );
}
