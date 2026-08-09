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
